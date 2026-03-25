/**
 * Client-side encryption layer — all crypto runs in the browser via Web Crypto API.
 * The server NEVER receives plaintext keys, passwords, or filenames.
 *
 * Key hierarchy:
 *  password → (PBKDF2) → KEK → encrypts master key
 *  master key → encrypts file keys, filenames, paths, and the auth challenge
 *  file key  → encrypts a single file's content (AES-256-GCM)
 *
 * Encoding: every encrypted blob is stored as IV‖ciphertext, base64-encoded.
 */
import type { EncryptedUserData, EncryptedFile } from "./schemas";
import { getStoredCredentials } from "./storage";

const SALT_LENGTH = 16;  // bytes
const IV_LENGTH = 12;    // 96-bit IV recommended for AES-GCM
const ITERATIONS = 100000; // PBKDF2 rounds

// ── Binary ↔ Base64 helpers ─────────────────────────────────────────────

/** Safe extraction — avoids TS issues with Uint8Array.buffer returning ArrayBufferLike. */
function toArrayBuffer(typed: Uint8Array): ArrayBuffer {
  return (typed.buffer as ArrayBuffer).slice(typed.byteOffset, typed.byteOffset + typed.byteLength);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function uint8ToBase64(bytes: Uint8Array): string {
  return arrayBufferToBase64(toArrayBuffer(bytes));
}

/** Decodes standard or URL-safe base64, auto-padding if needed. */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Invalid input: expected string");
  }

  base64 = base64.replace(/\s/g, "").trim();

  // Auto-pad to a multiple of 4
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padLength);
  // URL-safe → standard base64
  base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return toArrayBuffer(bytes);
}

// ── Key derivation & generation ─────────────────────────────────────────

/** Derive a Key-Encryption-Key from password + salt using PBKDF2-SHA256. */
async function deriveKEK(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/** Generate a random AES-256-GCM master key. */
async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

// ── AES-GCM primitives ──────────────────────────────────────────────────

async function encryptWithKey(
  data: ArrayBuffer,
  key: CryptoKey,
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    data,
  );
  return { ciphertext, iv };
}

async function decryptWithKey(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext,
  );
}

/** Pack IV and ciphertext into a single buffer: [IV (12 bytes) | ciphertext]. */
function combineIvAndCiphertext(
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
): Uint8Array {
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined;
}

/** Unpack IV and ciphertext from a combined buffer. */
function splitIvAndCiphertext(combined: Uint8Array): {
  iv: Uint8Array;
  ciphertext: Uint8Array;
} {
  return {
    iv: combined.slice(0, IV_LENGTH),
    ciphertext: combined.slice(IV_LENGTH),
  };
}

// ── Master key recovery ─────────────────────────────────────────────────

/**
 * Re-derive the master key from stored credentials.
 * password → KEK → decrypt(encryptedMasterKey) → CryptoKey
 */
async function recoverMasterKey(
  password: string,
  b64Salt: string,
  b64EncryptedMasterKey: string,
  extractable: boolean = false,
): Promise<CryptoKey> {
  const saltBuffer = base64ToArrayBuffer(b64Salt);
  const kek = await deriveKEK(password, new Uint8Array(saltBuffer));

  const { iv, ciphertext } = splitIvAndCiphertext(
    new Uint8Array(base64ToArrayBuffer(b64EncryptedMasterKey)),
  );
  const masterKeyBuffer = await decryptWithKey(toArrayBuffer(ciphertext), iv, kek);

  return crypto.subtle.importKey(
    "raw",
    masterKeyBuffer,
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  );
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Generate all encrypted material needed for user signup.
 * Called once when the user creates their account.
 */
export async function generateEncryptedUserData(
  password: string,
): Promise<EncryptedUserData> {
  const challenge = uint8ToBase64(
    crypto.getRandomValues(new Uint8Array(16)),
  );

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const kek = await deriveKEK(password, salt);
  const masterKey = await generateMasterKey();

  const masterKeyBuffer = await crypto.subtle.exportKey("raw", masterKey);
  const { ciphertext: encMasterKey, iv: mkIv } = await encryptWithKey(
    masterKeyBuffer,
    kek,
  );

  const { ciphertext: encChallenge, iv: chIv } = await encryptWithKey(
    toArrayBuffer(new TextEncoder().encode(challenge)),
    masterKey,
  );

  return {
    b64Salt: uint8ToBase64(salt),
    b64EncryptedMasterKey: uint8ToBase64(
      combineIvAndCiphertext(mkIv, encMasterKey),
    ),
    b64EncryptedChallenge: uint8ToBase64(
      combineIvAndCiphertext(chIv, encChallenge),
    ),
    clearChallenge: challenge,
  };
}

/**
 * Decrypt the auth challenge during sign-in.
 * The server sends an encrypted challenge; we decrypt it and send back the
 * cleartext to prove we hold the correct password (challenge-response auth).
 */
export async function decryptAuthChallenge(
  password: string,
  salt: string,
  encryptedMasterKey: string,
  encryptedChallenge: string,
): Promise<string> {
  const masterKey = await recoverMasterKey(password, salt, encryptedMasterKey);

  const { iv, ciphertext } = splitIvAndCiphertext(
    new Uint8Array(base64ToArrayBuffer(encryptedChallenge)),
  );
  const decrypted = await decryptWithKey(toArrayBuffer(ciphertext), iv, masterKey);
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a file for upload.
 * Each file gets its own random AES-256 key; that key is then encrypted
 * with the master key so the server only stores ciphertext.
 */
export async function encryptFile(file: File): Promise<EncryptedFile> {
  const masterKey = await getMasterKey();

  const fileKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  // Encrypt file content
  const fileBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    fileKey,
    fileBuffer,
  );

  // Encrypt file key with master key
  const rawFileKey = await crypto.subtle.exportKey("raw", fileKey);
  const { ciphertext: encKey, iv: keyIv } = await encryptWithKey(
    rawFileKey,
    masterKey,
  );

  // Encrypt filename with master key
  const { ciphertext: encName, iv: nameIv } = await encryptWithKey(
    toArrayBuffer(new TextEncoder().encode(file.name)),
    masterKey,
  );

  return {
    encryptedData,
    encryptedKey: uint8ToBase64(combineIvAndCiphertext(keyIv, encKey)),
    nonce: uint8ToBase64(iv),
    encryptedName: uint8ToBase64(combineIvAndCiphertext(nameIv, encName)),
  };
}

/**
 * Decrypt a downloaded file.
 * Reverses encryptFile: master key → decrypt file key → decrypt content.
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  b64EncryptedKey: string,
  b64Nonce: string,
): Promise<ArrayBuffer> {
  const masterKey = await getMasterKey();

  // Decrypt the per-file key with master key
  const { iv: keyIv, ciphertext: keyCiphertext } = splitIvAndCiphertext(
    new Uint8Array(base64ToArrayBuffer(b64EncryptedKey)),
  );
  const rawFileKey = await decryptWithKey(
    toArrayBuffer(keyCiphertext),
    keyIv,
    masterKey,
  );

  const fileKey = await crypto.subtle.importKey(
    "raw",
    rawFileKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Decrypt file content with the file key
  const nonce = new Uint8Array(base64ToArrayBuffer(b64Nonce));
  return decryptWithKey(encryptedData, nonce, fileKey);
}

/** Encrypt a path string with the master key (used for directory hierarchy). */
export async function encryptPath(path: string): Promise<string> {
  const masterKey = await getMasterKey();

  const { ciphertext, iv } = await encryptWithKey(
    toArrayBuffer(new TextEncoder().encode(path)),
    masterKey,
  );

  return uint8ToBase64(combineIvAndCiphertext(iv, ciphertext));
}

/** Decrypt an encrypted node name for display in the UI. */
export async function decryptName(b64EncryptedName: string): Promise<string> {
  const masterKey = await getMasterKey();

  const { iv, ciphertext } = splitIvAndCiphertext(
    new Uint8Array(base64ToArrayBuffer(b64EncryptedName)),
  );
  const decrypted = await decryptWithKey(toArrayBuffer(ciphertext), iv, masterKey);
  return new TextDecoder().decode(decrypted);
}

// ── Internal ────────────────────────────────────────────────────────────

/** Recover the master key from in-memory credentials. Throws if not authenticated. */
async function getMasterKey(): Promise<CryptoKey> {
  const credentials = getStoredCredentials();
  if (!credentials) throw new Error("Not authenticated");

  return recoverMasterKey(
    credentials.password,
    credentials.salt,
    credentials.encryptedMasterKey,
    true,
  );
}
