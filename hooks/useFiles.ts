"use client";

import { useState } from 'react';
import { nodeApi, Node } from '@/lib/api';
import { encryptFile, encryptPath, EncryptedFile } from '@/lib/crypto';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'encrypting' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UseFilesReturn {
  uploadFiles: (files: File[], parentUuid: string) => Promise<void>;
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  clearUploadProgress: () => void;
  loadNodes: (parentUuid: string) => Promise<Node[]>;
}

export function useFiles(): UseFilesReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const clearUploadProgress = () => {
    setUploadProgress([]);
  };

  const loadNodes = async (parentUuid: string): Promise<Node[]> => {
    try {
      const response = await nodeApi.indexDirectory(parentUuid);
      return response.data.nodes;
    } catch (err) {
      console.error('Failed to load nodes:', err);
      throw err;
    }
  };

  const uploadSingleFile = async (
    file: File,
    parentUuid: string,
    index: number,
    totalFiles: number
  ): Promise<void> => {
    const updateProgress = (progress: Partial<UploadProgress>) => {
      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[index] = { ...newProgress[index], ...progress };
        return newProgress;
      });
    };

    updateProgress({ fileName: file.name, progress: 0, status: 'encrypting' });

    try {
      // Encrypt the file
      const encryptedFile = await encryptFile(file);
      if (!encryptedFile) {
        throw new Error('Failed to encrypt file');
      }

      updateProgress({ progress: 30, status: 'uploading' });

      // Create the node metadata
      const path = parentUuid === 'root' ? `/${file.name}` : `/path/${file.name}`;
      const encryptedPath = await encryptPath(path);

      const createNodeResponse = await nodeApi.createNode({
        b64EncryptedEncryptionKey: encryptedFile.encryptedKey,
        b64EncryptionNonce: encryptedFile.nonce,
        b64EncryptedName: encryptedFile.encryptedName,
        b64EncryptedPath: encryptedPath,
        isDirectory: false,
        parentUuid,
        version: 1,
      });

      updateProgress({ progress: 60 });

      // Upload the encrypted file content
      const blob = new Blob([encryptedFile.encryptedData]);
      await nodeApi.saveNode(createNodeResponse.data.uuid, blob);

      updateProgress({ progress: 100, status: 'completed' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      updateProgress({ status: 'error', error: errorMessage });
      throw err;
    }
  };

  const uploadFiles = async (files: File[], parentUuid: string): Promise<void> => {
    setIsUploading(true);
    setUploadProgress(files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'encrypting',
    })));

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        await uploadSingleFile(files[i], parentUuid, i, files.length);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    clearUploadProgress,
    loadNodes,
  };
}
