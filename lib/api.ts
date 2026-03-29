/**
 * HTTP client for the Citadelle backend API.
 *
 * Every response is validated at runtime with Zod schemas (see schemas.ts),
 * so a backend contract change is caught immediately instead of causing
 * silent data corruption downstream.
 *
 * Auth: the JWT token is injected automatically via a request interceptor
 * (reads from lib/storage.ts).
 */
import axios from "axios";
import { getAuthToken } from "./storage";
import {
  signUpResponseSchema,
  challengeResponseSchema,
  verifyResponseSchema,
  getUserResponseSchema,
  createNodeResponseSchema,
  indexNodesResponseSchema,
  messageResponseSchema,
} from "./schemas";
import type {
  SignUpRequest,
  SignUpResponse,
  ChallengeResponse,
  VerifyRequest,
  VerifyResponse,
  GetUserResponse,
  CreateNodeRequest,
  CreateNodeResponse,
  IndexNodesResponse,
  MessageResponse,
} from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  transformResponse: [
    (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    },
  ],
});

// Inject Bearer token on every request when authenticated
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth API ────────────────────────────────────────────────────────────

export const authApi = {
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post("/users/", data);
    return signUpResponseSchema.parse(response.data);
  },

  async getChallenge(userId: string): Promise<ChallengeResponse> {
    const response = await api.get(`/auth/challenge/${userId}`);
    return challengeResponseSchema.parse(response.data);
  },

  async verifyChallenge(data: VerifyRequest): Promise<VerifyResponse> {
    const response = await api.post("/auth/verify", data);
    return verifyResponseSchema.parse(response.data);
  },

  async getUser(userId: string): Promise<GetUserResponse> {
    const response = await api.get(`/users/${userId}`);
    return getUserResponseSchema.parse(response.data);
  },
};

// ── Node API ────────────────────────────────────────────────────────────
// All node content is encrypted client-side; the server only stores blobs.

export type DownloadNodeResult = {
  data: Blob;
  // Sealed node key — nonce and ciphertext in separate fields
  keyNonce: string;
  encryptedKey: string;
  // Content nonce for the raw binary blob
  contentNonce: string;
  // Sealed filename — nonce and ciphertext in separate fields
  nameNonce: string;
  encryptedName: string;
};

export const nodeApi = {
  async createNode(data: CreateNodeRequest): Promise<CreateNodeResponse> {
    const response = await api.post("/nodes/", data);
    return createNodeResponseSchema.parse(response.data);
  },

  async saveNode(nodeUuid: string, encryptedFile: Blob): Promise<MessageResponse> {
    const formData = new FormData();
    formData.append("encryptedFile", encryptedFile);
    const response = await api.post(`/nodes/${nodeUuid}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return messageResponseSchema.parse(response.data);
  },

  async indexDirectory(nodeUuid: string): Promise<IndexNodesResponse> {
    const response = await api.get(`/nodes/${nodeUuid}`);
    return indexNodesResponseSchema.parse(response.data);
  },

  async downloadNode(nodeUuid: string): Promise<DownloadNodeResult> {
    // Use a fresh axios instance — the default one has a transformResponse
    // that tries to JSON.parse, which corrupts binary data.
    const response = await axios.get(`${API_URL}/nodes/${nodeUuid}/download`, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    const keyNonce = response.headers["x-key-nonce"];
    const encryptedKey = response.headers["x-encrypted-key"];
    const contentNonce = response.headers["x-content-nonce"];
    const nameNonce = response.headers["x-name-nonce"];
    const encryptedName = response.headers["x-encrypted-name"];

    const missing = [
      !keyNonce && "X-Key-Nonce",
      !encryptedKey && "X-Encrypted-Key",
      !contentNonce && "X-Content-Nonce",
      !nameNonce && "X-Name-Nonce",
      !encryptedName && "X-Encrypted-Name",
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new Error(
        `Download failed: missing response headers: ${missing.join(", ")}. ` +
          "Check that the server sets Access-Control-Expose-Headers for these headers.",
      );
    }

    return {
      data: response.data,
      keyNonce: keyNonce as string,
      encryptedKey: encryptedKey as string,
      contentNonce: contentNonce as string,
      nameNonce: nameNonce as string,
      encryptedName: encryptedName as string,
    };
  },

  async deleteNode(nodeUuid: string): Promise<MessageResponse> {
    const response = await api.delete(`/nodes/${nodeUuid}`);
    return messageResponseSchema.parse(response.data);
  },
};

export default api;
