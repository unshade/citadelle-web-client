/**
 * Zod schemas — single source of truth for all data shapes.
 * Types are inferred with z.infer so they stay in sync automatically.
 *
 * Sections:
 *  - Auth: signup / challenge-response / verify contracts
 *  - Nodes: encrypted file & directory metadata
 *  - Crypto: client-side encryption output shapes
 *  - Forms: validation rules for UI forms (used with React Hook Form)
 *  - Storage: in-memory credential shape
 */
import { z } from "zod/v4";

// ── Auth ────────────────────────────────────────────────────────────────
// Matches the Go backend API contract (POST /users, /auth/challenge, /auth/verify)

export const signUpRequestSchema = z.object({
  b64Salt: z.string().min(1),
  b64MasterKeyNonce: z.string().min(1),
  b64EncryptedMasterKey: z.string().min(1),
  b64ChallengeNonce: z.string().min(1),
  b64EncryptedChallenge: z.string().min(1),
  clearChallenge: z.string().min(1),
});
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export const signUpResponseSchema = z.object({
  data: z.object({ uuid: z.string().uuid() }),
  message: z.string(),
});
export type SignUpResponse = z.infer<typeof signUpResponseSchema>;

// ChallengeResponse — nonce and ciphertext as separate fields
export const challengeResponseSchema = z.object({
  data: z.object({
    b64ChallengeNonce: z.string().min(1),
    b64EncryptedChallenge: z.string().min(1),
  }),
  message: z.string(),
});
export type ChallengeResponse = z.infer<typeof challengeResponseSchema>;

export const verifyRequestSchema = z.object({
  userUuid: z.string().uuid(),
  clearChallenge: z.string().min(1),
});
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

export const verifyResponseSchema = z.object({
  data: z.object({ token: z.string().min(1) }),
  message: z.string(),
});
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;

// User as returned by the Go backend (PascalCase field names from GORM JSON).
// []byte fields are marshaled as base64 strings by encoding/json.
export const userSchema = z.object({
  Id: z.string(),
  Salt: z.string(),
  MasterKeyNonce: z.string(),
  EncryptedMasterKey: z.string(),
  ClearChallenge: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const getUserResponseSchema = z.object({
  data: userSchema,
  message: z.string(),
});
export type GetUserResponse = z.infer<typeof getUserResponseSchema>;

// ── Nodes ───────────────────────────────────────────────────────────────
// Server-side encrypted file/directory metadata (matches ServerNode model)

export const createNodeRequestSchema = z.object({
  b64ContentNonce: z.string(),           // empty for directories
  b64NameNonce: z.string().min(1),
  b64EncryptedName: z.string().min(1),
  b64PathNonce: z.string().min(1),
  b64EncryptedPath: z.string().min(1),
  isDirectory: z.boolean(),
  parentUuid: z.string(),
  version: z.number().int().nonnegative(),
});
export type CreateNodeRequest = z.infer<typeof createNodeRequestSchema>;

export const createNodeResponseSchema = z.object({
  data: z.object({ uuid: z.string() }),
  message: z.string(),
});
export type CreateNodeResponse = z.infer<typeof createNodeResponseSchema>;

// Node as returned by the backend. All []byte fields arrive as base64 strings.
export const nodeSchema = z.object({
  Id: z.string(),
  Version: z.number(),
  NameNonce: z.string(),
  EncryptedName: z.string(),
  ContentNonce: z.string(),
  B64PathNonce: z.string(),
  B64EncryptedPath: z.string(),
  IsDirectory: z.boolean(),
  IsFavourite: z.boolean(),
  ParentId: z.string().nullable(), // null for root-level nodes
});
export type Node = z.infer<typeof nodeSchema>;

export const indexNodesResponseSchema = z.object({
  data: z.object({ nodes: z.array(nodeSchema) }),
  message: z.string(),
});
export type IndexNodesResponse = z.infer<typeof indexNodesResponseSchema>;

export const messageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

// ── Crypto ──────────────────────────────────────────────────────────────
// Output shapes of the client-side encryption layer (lib/crypto.ts)

// Data produced during signup — sent to the server to create the user
export const encryptedUserDataSchema = z.object({
  b64Salt: z.string().min(1),
  b64MasterKeyNonce: z.string().min(1),
  b64EncryptedMasterKey: z.string().min(1),
  b64ChallengeNonce: z.string().min(1),
  b64EncryptedChallenge: z.string().min(1),
  clearChallenge: z.string().min(1),
});
export type EncryptedUserData = z.infer<typeof encryptedUserDataSchema>;

// Result of encrypting a single file before upload.
// contentNonce is stored separately from encryptedData (the raw binary blob).
export const encryptedFileSchema = z.object({
  encryptedData: z.instanceof(ArrayBuffer), // raw binary AES-GCM ciphertext
  contentNonce: z.string().min(1),           // base64 IV for file content
  encryptedName: z.string().min(1),          // base64 ciphertext of filename
  nameNonce: z.string().min(1),              // base64 IV for filename
});
export type EncryptedFile = z.infer<typeof encryptedFileSchema>;

// ── Forms ───────────────────────────────────────────────────────────────
// Validation schemas for React Hook Form (zodResolver)

export const signInFormSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});
export type SignInFormData = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z
  .object({
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignUpFormData = z.infer<typeof signUpFormSchema>;

export const unlockFormSchema = z.object({
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});
export type UnlockFormData = z.infer<typeof unlockFormSchema>;

export const createFolderFormSchema = z.object({
  folderName: z.string().min(1, "Folder name is required").trim(),
});
export type CreateFolderFormData = z.infer<typeof createFolderFormSchema>;

// ── Storage ─────────────────────────────────────────────────────────────
// Shape held in memory while the user is authenticated (never persisted to disk)

export const storedCredentialsSchema = z.object({
  userId: z.string(),
  password: z.string(),
  salt: z.string(),
  masterKeyNonce: z.string(),
  encryptedMasterKey: z.string(),
});
export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;
