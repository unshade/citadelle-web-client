"use client";

/**
 * TanStack Query hooks for the node (file/directory) endpoints.
 * Handles cache invalidation — after upload or folder creation,
 * the parent directory listing is automatically refetched.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeApi } from "@/lib/api";
import { encryptFile, encryptString, decryptFile, decryptString } from "@/lib/crypto";

/** Query: list child nodes for a given directory. */
export function useDirectoryNodes(parentUuid: string) {
  return useQuery({
    queryKey: ["nodes", parentUuid],
    queryFn: async () => {
      const response = await nodeApi.indexDirectory(parentUuid);
      return response.data.nodes;
    },
  });
}

/** Mutation: encrypt + upload one or more files, then invalidate the listing. */
export function useUploadFiles(parentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      onProgress,
    }: {
      files: File[];
      onProgress: (index: number, patch: { progress?: number; status?: string; error?: string }) => void;
    }) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress(i, { progress: 0, status: "encrypting" });

        const encrypted = await encryptFile(file);
        onProgress(i, { progress: 30, status: "uploading" });

        const path = parentUuid === "root" ? `/${file.name}` : `/path/${file.name}`;
        const sealedPath = await encryptString(path);

        const createResponse = await nodeApi.createNode({
          b64KeyNonce: encrypted.keyNonce,
          b64EncryptedEncryptionKey: encrypted.encryptedKey,
          b64ContentNonce: encrypted.contentNonce,
          b64NameNonce: encrypted.nameNonce,
          b64EncryptedName: encrypted.encryptedName,
          b64PathNonce: sealedPath.nonce,
          b64EncryptedPath: sealedPath.ciphertext,
          isDirectory: false,
          parentUuid,
          version: 1,
        });

        onProgress(i, { progress: 60 });

        const blob = new Blob([encrypted.encryptedData]);
        await nodeApi.saveNode(createResponse.data.uuid, blob);

        onProgress(i, { progress: 100, status: "completed" });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes", parentUuid] });
    },
  });
}

/**
 * Mutation: download an encrypted file, decrypt it client-side,
 * and trigger a browser download with the cleartext filename and content.
 */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async (nodeId: string) => {
      const { data, keyNonce, encryptedKey, contentNonce, nameNonce, encryptedName } =
        await nodeApi.downloadNode(nodeId);

      const fileName = await decryptString({ nonce: nameNonce, ciphertext: encryptedName });

      const encryptedBuffer = await data.arrayBuffer();
      const decryptedBuffer = await decryptFile(
        encryptedBuffer,
        { nonce: keyNonce, ciphertext: encryptedKey },
        contentNonce,
      );

      const blob = new Blob([decryptedBuffer]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { fileName };
    },
  });
}

/** Mutation: delete a node (file or directory, recursive), then invalidate the listing. */
export function useDeleteNode(parentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      await nodeApi.deleteNode(nodeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes", parentUuid] });
    },
  });
}

/** Mutation: create an encrypted directory node, then invalidate the listing. */
export function useCreateFolder(parentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderName: string) => {
      const path = parentUuid === "root" ? `/${folderName}` : `/path/${folderName}`;
      const sealedPath = await encryptString(path);
      const sealedName = await encryptString(folderName);

      await nodeApi.createNode({
        b64KeyNonce: "",
        b64EncryptedEncryptionKey: "",
        b64ContentNonce: "",
        b64NameNonce: sealedName.nonce,
        b64EncryptedName: sealedName.ciphertext,
        b64PathNonce: sealedPath.nonce,
        b64EncryptedPath: sealedPath.ciphertext,
        isDirectory: true,
        parentUuid,
        version: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes", parentUuid] });
    },
  });
}
