/**
 * Tests for lib/crypto.ts
 *
 * Covers:
 *  - b64Encode / b64Decode (pure helpers)
 *  - aesEncrypt / aesDecrypt (core primitive)
 *  - generateEncryptedUserData / decryptAuthChallenge (auth flow)
 *  - encryptFile / decryptFile (file round-trip)
 *  - encryptString / decryptString (node metadata)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  b64Encode,
  b64Decode,
  aesEncrypt,
  aesDecrypt,
  generateEncryptedUserData,
  decryptAuthChallenge,
  encryptFile,
  decryptFile,
  encryptString,
  decryptString,
  invalidateMasterKeyCache,
} from "./crypto";
import { storeCredentials, clearCredentials } from "./storage";

// ── b64Encode / b64Decode ────────────────────────────────────────────────

describe("b64Encode / b64Decode", () => {
  it("roundtrips arbitrary bytes (Uint8Array)", () => {
    const original = new Uint8Array([0, 1, 127, 128, 255]);
    expect(b64Decode(b64Encode(original))).toEqual(original);
  });

  it("roundtrips arbitrary bytes (ArrayBuffer)", () => {
    const original = new Uint8Array([10, 20, 30]);
    expect(b64Decode(b64Encode(original.buffer))).toEqual(original);
  });

  it("accepts URL-safe base64 (- and _ instead of + and /)", () => {
    const original = new Uint8Array([0xfb, 0xef, 0xbe]);
    const urlSafe = b64Encode(original).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    expect(b64Decode(urlSafe)).toEqual(original);
  });

  it("accepts base64 with missing padding", () => {
    const original = new Uint8Array([1, 2, 3]);
    const noPad = b64Encode(original).replace(/=/g, "");
    expect(b64Decode(noPad)).toEqual(original);
  });

  it("throws on null input", () => {
    // @ts-expect-error intentional bad input
    expect(() => b64Decode(null)).toThrow(/b64Decode/);
  });

  it("throws on undefined input", () => {
    // @ts-expect-error intentional bad input
    expect(() => b64Decode(undefined)).toThrow(/b64Decode/);
  });

  it("throws on empty string", () => {
    expect(() => b64Decode("")).toThrow(/b64Decode/);
  });

  it("throws on whitespace-only string", () => {
    expect(() => b64Decode("   ")).toThrow(/b64Decode/);
  });
});

// ── aesEncrypt / aesDecrypt ──────────────────────────────────────────────

describe("aesEncrypt / aesDecrypt", () => {
  let key: CryptoKey;

  beforeAll(async () => {
    key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
  });

  it("returns Sealed with separate nonce and ciphertext strings", async () => {
    const sealed = await aesEncrypt(new TextEncoder().encode("hello"), key);
    expect(typeof sealed.nonce).toBe("string");
    expect(typeof sealed.ciphertext).toBe("string");
    expect(sealed.nonce).not.toBe("");
    expect(sealed.ciphertext).not.toBe("");
    // nonce and ciphertext must be different values
    expect(sealed.nonce).not.toBe(sealed.ciphertext);
  });

  it("roundtrips arbitrary plaintext", async () => {
    const plaintext = new TextEncoder().encode("citadelle rocks");
    const sealed = await aesEncrypt(plaintext, key);
    const decrypted = await aesDecrypt(sealed, key);
    expect(new Uint8Array(decrypted)).toEqual(plaintext);
  });

  it("produces different nonce + ciphertext on every call (random IV)", async () => {
    const data = new TextEncoder().encode("same input");
    const a = await aesEncrypt(data, key);
    const b = await aesEncrypt(data, key);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("rejects decryption with the wrong key", async () => {
    const wrongKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    const sealed = await aesEncrypt(new TextEncoder().encode("secret"), key);
    await expect(aesDecrypt(sealed, wrongKey)).rejects.toThrow();
  });

  it("rejects decryption when ciphertext is tampered", async () => {
    const sealed = await aesEncrypt(new TextEncoder().encode("data"), key);
    // Flip a bit in the ciphertext
    const bytes = b64Decode(sealed.ciphertext);
    bytes[bytes.length - 1] ^= 0xff;
    const tampered = { ...sealed, ciphertext: b64Encode(bytes) };
    await expect(aesDecrypt(tampered, key)).rejects.toThrow();
  });

  it("rejects decryption when nonce is wrong length", async () => {
    const sealed = await aesEncrypt(new TextEncoder().encode("data"), key);
    const shortNonce = { ...sealed, nonce: b64Encode(new Uint8Array(6)) };
    await expect(aesDecrypt(shortNonce, key)).rejects.toThrow(/nonce length/);
  });
});

// ── generateEncryptedUserData / decryptAuthChallenge ─────────────────────

describe("generateEncryptedUserData / decryptAuthChallenge", () => {
  it("returns separate fields for salt, nonces, and ciphertexts", async () => {
    const result = await generateEncryptedUserData("password123");
    // All fields present and non-empty
    for (const field of [
      result.b64Salt,
      result.b64MasterKeyNonce,
      result.b64EncryptedMasterKey,
      result.b64ChallengeNonce,
      result.b64EncryptedChallenge,
      result.clearChallenge,
    ]) {
      expect(typeof field).toBe("string");
      expect(field.length).toBeGreaterThan(0);
    }
    // Nonces must be distinct from their ciphertexts
    expect(result.b64MasterKeyNonce).not.toBe(result.b64EncryptedMasterKey);
    expect(result.b64ChallengeNonce).not.toBe(result.b64EncryptedChallenge);
  });

  it("decrypts the challenge with the correct password", async () => {
    const password = "correct-horse-battery-staple";
    const data = await generateEncryptedUserData(password);
    const decrypted = await decryptAuthChallenge(
      password,
      data.b64Salt,
      { nonce: data.b64MasterKeyNonce, ciphertext: data.b64EncryptedMasterKey },
      { nonce: data.b64ChallengeNonce, ciphertext: data.b64EncryptedChallenge },
    );
    expect(decrypted).toBe(data.clearChallenge);
  });

  it("fails challenge decryption with the wrong password", async () => {
    const data = await generateEncryptedUserData("correct-password");
    await expect(
      decryptAuthChallenge(
        "wrong-password",
        data.b64Salt,
        { nonce: data.b64MasterKeyNonce, ciphertext: data.b64EncryptedMasterKey },
        { nonce: data.b64ChallengeNonce, ciphertext: data.b64EncryptedChallenge },
      ),
    ).rejects.toThrow();
  });
});

// ── Session-dependent crypto ─────────────────────────────────────────────
// These tests require valid credentials in the storage module.

describe("session-dependent crypto (encryptString, decryptString, encryptFile, decryptFile)", () => {
  const TEST_PASSWORD = "session-test-password-42";

  beforeAll(async () => {
    const userData = await generateEncryptedUserData(TEST_PASSWORD);
    storeCredentials({
      userId: "test-user-id",
      password: TEST_PASSWORD,
      salt: userData.b64Salt,
      masterKeyNonce: userData.b64MasterKeyNonce,
      encryptedMasterKey: userData.b64EncryptedMasterKey,
    });
  });

  afterAll(() => {
    invalidateMasterKeyCache();
    clearCredentials();
  });

  // ── encryptString / decryptString ──────────────────────────────────────

  describe("encryptString / decryptString", () => {
    it("roundtrips a filename", async () => {
      const name = "my-secret-file.pdf";
      const sealed = await encryptString(name);
      expect(typeof sealed.nonce).toBe("string");
      expect(typeof sealed.ciphertext).toBe("string");
      expect(sealed.nonce).not.toBe(sealed.ciphertext);
      expect(await decryptString(sealed)).toBe(name);
    });

    it("roundtrips a path", async () => {
      const path = "/documents/contracts/2024";
      expect(await decryptString(await encryptString(path))).toBe(path);
    });

    it("produces unique sealed values on each call (random nonce)", async () => {
      const text = "same-text";
      const a = await encryptString(text);
      const b = await encryptString(text);
      expect(a.nonce).not.toBe(b.nonce);
      expect(a.ciphertext).not.toBe(b.ciphertext);
    });

    it("names and paths use the same function (consistent behaviour)", async () => {
      const inputs = ["Documents", "/Documents/reports", "report.pdf"];
      for (const input of inputs) {
        expect(await decryptString(await encryptString(input))).toBe(input);
      }
    });
  });

  // ── encryptFile / decryptFile ──────────────────────────────────────────

  describe("encryptFile / decryptFile", () => {
    it("roundtrips file content", async () => {
      const content = "The quick brown fox jumps over the lazy dog";
      const file = new File([content], "fox.txt", { type: "text/plain" });
      const enc = await encryptFile(file);

      // Verify structure: all fields present and separate
      expect(enc.encryptedData).toBeInstanceOf(ArrayBuffer);
      for (const field of [enc.contentNonce, enc.encryptedName, enc.nameNonce]) {
        expect(typeof field).toBe("string");
        expect(field.length).toBeGreaterThan(0);
      }
      // Nonce must differ from its paired ciphertext
      expect(enc.nameNonce).not.toBe(enc.encryptedName);

      const decrypted = await decryptFile(enc.encryptedData, enc.contentNonce);
      expect(new TextDecoder().decode(decrypted)).toBe(content);
    });

    it("encrypts the filename and it can be decrypted", async () => {
      const file = new File(["data"], "secret-report.docx");
      const enc = await encryptFile(file);
      expect(await decryptString({ nonce: enc.nameNonce, ciphertext: enc.encryptedName })).toBe(
        "secret-report.docx",
      );
    });

    it("rejects decryption of tampered file content", async () => {
      const file = new File(["sensitive data"], "test.bin");
      const enc = await encryptFile(file);
      const tampered = enc.encryptedData.slice(0);
      new Uint8Array(tampered)[20] ^= 0xff;
      await expect(
        decryptFile(tampered, enc.contentNonce),
      ).rejects.toThrow();
    });

    it("produces different ciphertext on each upload of the same file", async () => {
      const file = new File(["same content"], "dup.txt");
      const a = await encryptFile(file);
      const b = await encryptFile(file);
      expect(a.contentNonce).not.toBe(b.contentNonce);
    });
  });
});
