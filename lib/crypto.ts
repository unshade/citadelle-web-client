/**
 * Client-side encryption layer — all crypto runs in the browser via Web Crypto API.
 * The server NEVER receives plaintext keys, passwords, or filenames.
 *
 * Key hierarchy:
 *  password → (PBKDF2-SHA256) → KEK → seals master key
 *  master key → encrypts file content, node names, node paths, auth challenge
 *
 * Design principle — AES-GCM with storable nonce:
 *  Every encrypted value is TWO pieces stored in separate fields, never concatenated:
 *    nonce:      12-byte random AES-GCM IV (base64-encoded)
 *    ciphertext: AES-GCM output (base64-encoded)
 *
 *  Exception: file content blobs are uploaded as raw binary to avoid base64
 *  overhead on large files; only their nonce goes into node metadata.
 */
import type { EncryptedUserData, EncryptedFile } from "./schemas";
import { getStoredCredentials } from "./storage";

const SALT_LENGTH = 16;     // bytes — PBKDF2 salt
const IV_LENGTH = 12;       // bytes — AES-GCM IV (96-bit, NIST-recommended)
const ITERATIONS = 100_000; // PBKDF2 rounds

// ── Sealed type ─────────────────────────────────────────────────────────

/**
 * A sealed (encrypted) value — always two separate pieces.
 * Callers store nonce and ciphertext in separate DB columns / API fields.
 */
export type Sealed = {
  nonce: string;      // base64-encoded 12-byte AES-GCM IV
  ciphertext: string; // base64-encoded AES-GCM ciphertext
};

// ── Binary ↔ Base64 ──────────────────────────────────────────────────────

/**
 * Encode binary data as standard (non-URL-safe) base64.
 * Exported so callers and tests can use the same encoding.
 */
export function b64Encode(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode standard or URL-safe base64 to a Uint8Array.
 * Accepts missing padding and URL-safe characters (- and _).
 * Throws a descriptive error on non-string or empty input.
 */
export function b64Decode(b64: string): Uint8Array<ArrayBuffer> {
  if (typeof b64 !== "string" || b64.trim() === "") {
    throw new Error(
      `b64Decode: expected a non-empty base64 string, got ${JSON.stringify(b64)}`,
    );
  }
  const normalised = b64.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised.padEnd(
    normalised.length + ((4 - (normalised.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── AES-GCM primitives ───────────────────────────────────────────────────

/**
 * Encrypt data with an AES-GCM key.
 * Returns nonce and ciphertext as separate base64 strings — never concatenated.
 */
export async function aesEncrypt(
  data: BufferSource,
  key: CryptoKey,
): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    nonce: b64Encode(iv),
    ciphertext: b64Encode(ciphertext),
  };
}

/**
 * Decrypt a Sealed value produced by aesEncrypt.
 * Throws on wrong key, tampered ciphertext, or malformed input.
 */
export async function aesDecrypt(
  sealed: Sealed,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = b64Decode(sealed.nonce);
  if (iv.length !== IV_LENGTH) {
    throw new Error(`aesDecrypt: invalid nonce length ${iv.length}, expected ${IV_LENGTH}`);
  }
  const ciphertext = b64Decode(sealed.ciphertext);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}

// ── Key derivation & generation ──────────────────────────────────────────

async function deriveKEK(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function generateAesKey(extractable: boolean): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  );
}

/**
 * Re-derive the master key from stored credentials.
 * password → KEK → aesDecrypt(sealedMasterKey) → CryptoKey
 * The result is NOT extractable: it only encrypts/decrypts, never exports.
 */
async function recoverMasterKey(
  password: string,
  b64Salt: string,
  sealedMasterKey: Sealed,
): Promise<CryptoKey> {
  const kek = await deriveKEK(password, b64Decode(b64Salt));
  const rawMasterKey = await aesDecrypt(sealedMasterKey, kek);
  return crypto.subtle.importKey(
    "raw",
    rawMasterKey,
    { name: "AES-GCM", length: 256 },
    false, // not extractable: never needs to leave the browser in raw form
    ["encrypt", "decrypt"],
  );
}

// ── Master key cache ─────────────────────────────────────────────────────
// PBKDF2 at 100k rounds takes ~100 ms; caching avoids re-deriving on every
// crypto operation within the same session.

let _cachedMasterKey: CryptoKey | null = null;

/**
 * Invalidate the cached master key.
 * Must be called on logout or whenever credentials change.
 */
export function invalidateMasterKeyCache(): void {
  _cachedMasterKey = null;
}

async function getMasterKey(): Promise<CryptoKey> {
  if (_cachedMasterKey) return _cachedMasterKey;

  const creds = getStoredCredentials();
  if (!creds) throw new Error("Not authenticated");

  _cachedMasterKey = await recoverMasterKey(
    creds.password,
    creds.salt,
    { nonce: creds.masterKeyNonce, ciphertext: creds.encryptedMasterKey },
  );
  return _cachedMasterKey;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Generate all encrypted material for user signup (runs once, client-side).
 * Returns the data sent to the server to create the account; the server never
 * sees the password or the raw master key.
 */
export async function generateEncryptedUserData(
  password: string,
): Promise<EncryptedUserData> {
  const clearChallenge = b64Encode(crypto.getRandomValues(new Uint8Array(16)));
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const kek = await deriveKEK(password, salt);
  const masterKey = await generateAesKey(true); // extractable only here, to export it

  const rawMasterKey = await crypto.subtle.exportKey("raw", masterKey);
  const sealedMasterKey = await aesEncrypt(rawMasterKey, kek);
  const sealedChallenge = await aesEncrypt(
    new TextEncoder().encode(clearChallenge),
    masterKey,
  );

  return {
    b64Salt: b64Encode(salt),
    b64MasterKeyNonce: sealedMasterKey.nonce,
    b64EncryptedMasterKey: sealedMasterKey.ciphertext,
    b64ChallengeNonce: sealedChallenge.nonce,
    b64EncryptedChallenge: sealedChallenge.ciphertext,
    clearChallenge,
  };
}

/**
 * Decrypt the auth challenge during sign-in.
 * Proves to the server that the user holds the correct password without
 * transmitting the password itself (zero-knowledge challenge-response).
 */
export async function decryptAuthChallenge(
  password: string,
  b64Salt: string,
  sealedMasterKey: Sealed,
  sealedChallenge: Sealed,
): Promise<string> {
  const masterKey = await recoverMasterKey(password, b64Salt, sealedMasterKey);
  const plaintext = await aesDecrypt(sealedChallenge, masterKey);
  return new TextDecoder().decode(plaintext);
}

/**
 * Encrypt a file for upload.
 * File content is encrypted directly with the master key using a random IV.
 * The ciphertext is stored as raw binary (not base64) to avoid overhead on
 * large uploads. Only the content nonce goes into the node metadata.
 */
export async function encryptFile(file: File): Promise<EncryptedFile> {
  const masterKey = await getMasterKey();

  // Encrypt file content with the master key — nonce stored separately from the binary blob
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    await file.arrayBuffer(),
  );

  // Seal the filename with the master key
  const sealedName = await aesEncrypt(new TextEncoder().encode(file.name), masterKey);

  return {
    encryptedData,
    contentNonce: b64Encode(iv),
    encryptedName: sealedName.ciphertext,
    nameNonce: sealedName.nonce,
  };
}

/**
 * Decrypt a downloaded file.
 * master key → decrypt file content directly.
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  b64ContentNonce: string,
): Promise<ArrayBuffer> {
  const masterKey = await getMasterKey();

  const iv = b64Decode(b64ContentNonce);
  if (iv.length !== IV_LENGTH) {
    throw new Error(
      `decryptFile: invalid content nonce length ${iv.length}, expected ${IV_LENGTH}`,
    );
  }
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, masterKey, encryptedData);
}

/**
 * Encrypt a node name or path with the master key.
 * Returns a Sealed value with nonce and ciphertext stored separately.
 * Used for every node — files, folders, names, and paths.
 */
export async function encryptString(text: string): Promise<Sealed> {
  const masterKey = await getMasterKey();
  return aesEncrypt(new TextEncoder().encode(text), masterKey);
}

/**
 * Decrypt a node name or path previously encrypted with encryptString.
 */
export async function decryptString(sealed: Sealed): Promise<string> {
  const masterKey = await getMasterKey();
  const plaintext = await aesDecrypt(sealed, masterKey);
  return new TextDecoder().decode(plaintext);
}
