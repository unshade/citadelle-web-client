import axios from 'axios';
import { getAuthToken } from './crypto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure we get raw JSON, not transformed
  transformResponse: [(data) => {
    // Try to parse as JSON
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }],
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log responses for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface SignUpRequest {
  b64Salt: string;
  b64EncryptedMasterKey: string;
  b64EncryptedChallenge: string;
  clearChallenge: string;
}

export interface SignUpResponse {
  data: {
    uuid: string;
  };
  message: string;
}

export interface ChallengeResponse {
  data: {
    b64EncryptedChallenge: string;
  };
  message: string;
}

export interface VerifyRequest {
  userUuid: string;
  clearChallenge: string;
}

export interface VerifyResponse {
  data: {
    token: string;
  };
  message: string;
}

export interface User {
  Id: string;
  Salt: string;
  EncryptedMasterKey: string;
  EncryptedChallenge: string;
  ClearChallenge: string;
}

// Node types
export interface CreateNodeRequest {
  b64EncryptedEncryptionKey: string;
  b64EncryptionNonce: string;
  b64EncryptedName: string;
  b64EncryptedPath: string;
  isDirectory: boolean;
  parentUuid: string;
  version: number;
}

export interface CreateNodeResponse {
  data: {
    uuid: string;
  };
  message: string;
}

export interface Node {
  Id: string;
  Version: number;
  EncryptedName: string;
  EncryptedKey: string;
  Nonce: string;
  B64EncryptedPath: string;
  IsDirectory: boolean;
  ParentId: string;
}

export interface IndexNodesResponse {
  data: {
    nodes: Node[];
  };
  message: string;
}

// API Functions
export const authApi = {
  // Sign up - create new user
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post<SignUpResponse>('/users/', data);
    return response.data;
  },

  // Get encrypted challenge for authentication
  async getChallenge(userId: string): Promise<ChallengeResponse> {
    const response = await api.get<ChallengeResponse>(`/auth/challenge/${userId}`);
    return response.data;
  },

  // Verify challenge and get JWT token
  async verifyChallenge(data: VerifyRequest): Promise<VerifyResponse> {
    const response = await api.post<VerifyResponse>('/auth/verify', data);
    return response.data;
  },

  // Get user data (for retrieving salt and encrypted master key)
  async getUser(userId: string): Promise<{ data: User; message: string }> {
    const response = await api.get<{ data: User; message: string }>(`/users/${userId}`);
    return response.data;
  },
};

// Node API Functions
export const nodeApi = {
  // Create a new node (file or directory)
  async createNode(data: CreateNodeRequest): Promise<CreateNodeResponse> {
    const response = await api.post<CreateNodeResponse>('/nodes/', data);
    return response.data;
  },

  // Save file content for a node
  async saveNode(nodeUuid: string, encryptedFile: Blob): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('encryptedFile', encryptedFile);
    const response = await api.post<{ message: string }>(`/nodes/${nodeUuid}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get children nodes in a directory
  async indexDirectory(nodeUuid: string): Promise<IndexNodesResponse> {
    const response = await api.get<IndexNodesResponse>(`/nodes/${nodeUuid}`);
    return response.data;
  },

  // Download a file
  async downloadNode(nodeUuid: string): Promise<{
    data: Blob;
    encryptedKey: string;
    nonce: string;
    encryptedName: string;
  }> {
    const response = await api.get<Blob>(`/nodes/${nodeUuid}/download`, {
      responseType: 'blob',
    });
    
    return {
      data: response.data,
      encryptedKey: response.headers['x-encrypted-key'] as string,
      nonce: response.headers['x-encryption-nonce'] as string,
      encryptedName: response.headers['x-encrypted-name'] as string,
    };
  },

  // Delete a node
  async deleteNode(nodeUuid: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/nodes/${nodeUuid}`);
    return response.data;
  },
};

export default api;
