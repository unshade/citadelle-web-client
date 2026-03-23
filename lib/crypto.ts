// Client-side encryption service using Web Crypto API
// All encryption happens in the browser - server never sees keys or passwords

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export interface EncryptedUserData {
  b64Salt: string;
  b64EncryptedMasterKey: string;
  b64EncryptedChallenge: string;
  clearChallenge: string;
}

// Generate random bytes as base64
function generateRandomBase64(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(bytes.buffer);
}

// URL-safe base64 encoding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// URL-safe base64 decoding with better error handling
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    console.log('Decoding base64, input length:', base64?.length, 'first 20 chars:', base64?.substring(0, 20));
    
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid input: expected string');
    }
    
    // Remove any whitespace and padding issues
    base64 = base64.replace(/\s/g, '').trim();
    
    // Handle padding - add = until length is multiple of 4
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);
    
    // Replace URL-safe characters with standard base64
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    
    console.log('After processing, length:', base64.length);
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Base64 decode error:', e, 'input was:', base64?.substring(0, 50));
    throw new Error(`Invalid base64 string: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// Derive KEK from password using PBKDF2
async function deriveKEK(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Generate random master key
async function generateMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-GCM
async function encryptWithKey(data: ArrayBuffer, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data
  );
  return { ciphertext, iv };
}

// Decrypt data with AES-GCM
async function decryptWithKey(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext
  );
}

// Encrypt challenge with master key
async function encryptChallenge(challenge: string, masterKey: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const challengeBuffer = encoder.encode(challenge);
  const result = await encryptWithKey(challengeBuffer.buffer, masterKey);
  return { encrypted: result.ciphertext, iv: result.iv };
}

// Decrypt challenge with master key
async function decryptChallenge(encryptedChallenge: ArrayBuffer, iv: Uint8Array, masterKey: CryptoKey): Promise<string> {
  const decrypted = await decryptWithKey(encryptedChallenge, iv, masterKey);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Main function: Generate encrypted user data for signup
export async function generateEncryptedUserData(
  password: string
): Promise<EncryptedUserData> {
  // 1. Generate random challenge (16 bytes, URL-safe)
  const challenge = generateRandomBase64(16);
  
  // 2. Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // 3. Derive KEK from password
  const kek = await deriveKEK(password, salt);
  
  // 4. Generate random master key
  const masterKey = await generateMasterKey();
  
  // 5. Encrypt master key with KEK
  const masterKeyBuffer = await crypto.subtle.exportKey('raw', masterKey);
  const { ciphertext: encryptedMasterKey, iv: masterKeyIv } = await encryptWithKey(masterKeyBuffer, kek);
  
  // 6. Encrypt challenge with master key
  const { encrypted: encryptedChallenge, iv: challengeIv } = await encryptChallenge(challenge, masterKey);
  
  // Combine encrypted data with IVs (IV + ciphertext)
  const combinedEncryptedMasterKey = new Uint8Array(masterKeyIv.length + encryptedMasterKey.byteLength);
  combinedEncryptedMasterKey.set(masterKeyIv);
  combinedEncryptedMasterKey.set(new Uint8Array(encryptedMasterKey), masterKeyIv.length);
  
  const combinedEncryptedChallenge = new Uint8Array(challengeIv.length + encryptedChallenge.byteLength);
  combinedEncryptedChallenge.set(challengeIv);
  combinedEncryptedChallenge.set(new Uint8Array(encryptedChallenge), challengeIv.length);
  
  return {
    b64Salt: arrayBufferToBase64(salt.buffer),
    b64EncryptedMasterKey: arrayBufferToBase64(combinedEncryptedMasterKey.buffer),
    b64EncryptedChallenge: arrayBufferToBase64(combinedEncryptedChallenge.buffer),
    clearChallenge: challenge,
  };
}

// Decrypt challenge for authentication
export async function decryptAuthChallenge(
  password: string,
  salt: string,
  encryptedMasterKey: string,
  encryptedChallenge: string
): Promise<string> {
  console.log('DecryptAuthChallenge called with:', {
    passwordLength: password?.length,
    saltLength: salt?.length,
    encryptedMasterKeyLength: encryptedMasterKey?.length,
    encryptedChallengeLength: encryptedChallenge?.length
  });
  
  // 1. Derive KEK
  const saltBuffer = base64ToArrayBuffer(salt);
  const kek = await deriveKEK(password, new Uint8Array(saltBuffer));
  
  // 2. Decrypt master key
  const masterKeyCombined = new Uint8Array(base64ToArrayBuffer(encryptedMasterKey));
  const masterKeyIv = masterKeyCombined.slice(0, IV_LENGTH);
  const masterKeyCiphertext = masterKeyCombined.slice(IV_LENGTH);
  
  const masterKeyBuffer = await decryptWithKey(masterKeyCiphertext.buffer, masterKeyIv, kek);
  const masterKey = await crypto.subtle.importKey(
    'raw',
    masterKeyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // 3. Decrypt challenge
  const challengeCombined = new Uint8Array(base64ToArrayBuffer(encryptedChallenge));
  const challengeIv = challengeCombined.slice(0, IV_LENGTH);
  const challengeCiphertext = challengeCombined.slice(IV_LENGTH);
  
  return await decryptChallenge(challengeCiphertext.buffer, challengeIv, masterKey);
}

// Store credentials securely in memory (not localStorage for security)
let storedCredentials: {
  userId: string;
  password: string;
  salt: string;
  encryptedMasterKey: string;
} | null = null;

export function storeCredentials(credentials: typeof storedCredentials) {
  storedCredentials = credentials;
}

export function getStoredCredentials() {
  return storedCredentials;
}

export function clearCredentials() {
  storedCredentials = null;
}

// Store token - keep in memory and localStorage for persistence across reloads
const TOKEN_KEY = 'citadelle_auth_token';
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  // Return memory token if available
  if (authToken) {
    return authToken;
  }
  // Fall back to localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Store user ID - for session restoration
const USER_ID_KEY = 'citadelle_user_id';

export function setStoredUserId(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

export function getStoredUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_ID_KEY);
  }
  return null;
}

export function clearStoredUserId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
  }
}

// Check if user is authenticated (has token)
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// File encryption functions
export interface EncryptedFile {
  encryptedData: ArrayBuffer;
  encryptedKey: string;  // base64
  nonce: string;         // base64 IV
  encryptedName: string; // base64
}

// Get master key from stored credentials
async function getMasterKey(): Promise<CryptoKey | null> {
  const credentials = getStoredCredentials();
  if (!credentials) return null;

  try {
    const saltBuffer = base64ToArrayBuffer(credentials.salt);
    const kek = await deriveKEK(credentials.password, new Uint8Array(saltBuffer));
    
    const masterKeyCombined = new Uint8Array(base64ToArrayBuffer(credentials.encryptedMasterKey));
    const masterKeyIv = masterKeyCombined.slice(0, IV_LENGTH);
    const masterKeyCiphertext = masterKeyCombined.slice(IV_LENGTH);
    
    const masterKeyBuffer = await decryptWithKey(masterKeyCiphertext.buffer, masterKeyIv, kek);
    return await crypto.subtle.importKey(
      'raw',
      masterKeyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (e) {
    console.error('Failed to get master key:', e);
    return null;
  }
}

// Encrypt a file
export async function encryptFile(file: File): Promise<EncryptedFile | null> {
  const masterKey = await getMasterKey();
  if (!masterKey) {
    throw new Error('Not authenticated');
  }

  // Generate a new key for this file
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Encrypt the file content
  const fileBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    fileKey,
    fileBuffer
  );

  // Encrypt the file key with the master key
  const rawFileKey = await crypto.subtle.exportKey('raw', fileKey);
  const keyNonce = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: keyNonce as BufferSource },
    masterKey,
    rawFileKey
  );

  // Encrypt the filename
  const nameEncoder = new TextEncoder();
  const nameBuffer = nameEncoder.encode(file.name);
  const nameNonce = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedName = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nameNonce as BufferSource },
    masterKey,
    nameBuffer
  );

  // Combine key + nonce, name + nonce
  const combinedKey = new Uint8Array(keyNonce.length + encryptedKey.byteLength);
  combinedKey.set(keyNonce);
  combinedKey.set(new Uint8Array(encryptedKey), keyNonce.length);

  const combinedName = new Uint8Array(nameNonce.length + encryptedName.byteLength);
  combinedName.set(nameNonce);
  combinedName.set(new Uint8Array(encryptedName), nameNonce.length);

  return {
    encryptedData,
    encryptedKey: arrayBufferToBase64(combinedKey.buffer),
    nonce: arrayBufferToBase64(iv.buffer),
    encryptedName: arrayBufferToBase64(combinedName.buffer),
  };
}

// Encrypt a path string
export async function encryptPath(path: string): Promise<string> {
  const masterKey = await getMasterKey();
  if (!masterKey) {
    throw new Error('Not authenticated');
  }

  const encoder = new TextEncoder();
  const pathBuffer = encoder.encode(path);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    masterKey,
    pathBuffer
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}
