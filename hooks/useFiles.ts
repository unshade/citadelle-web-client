"use client";

/**
 * File management hook — wraps api/nodes.ts mutations with upload progress tracking.
 * Re-exports useDirectoryNodes and useCreateFolder directly from the API layer.
 */
import { useState, useCallback } from "react";
import { useUploadFiles as useUploadFilesMutation } from "@/api/nodes";
import type { Node } from "@/lib/schemas";

type UploadProgress = {
  fileName: string;
  progress: number;
  status: "encrypting" | "uploading" | "completed" | "error";
  error?: string;
};

/** Wraps the raw upload mutation with UI progress state. */
export function useUploadFiles(parentUuid: string) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const mutation = useUploadFilesMutation(parentUuid);

  const onProgress = useCallback(
    (index: number, patch: { progress?: number; status?: string; error?: string }) => {
      setUploadProgress((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch } as UploadProgress;
        return next;
      });
    },
    [],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploadProgress(
        files.map((file) => ({
          fileName: file.name,
          progress: 0,
          status: "encrypting" as const,
        })),
      );

      try {
        await mutation.mutateAsync({ files, onProgress });
      } catch (err) {
        // Individual file errors are already tracked via onProgress;
        // re-throw so the caller can show a global error if needed
        throw err;
      }
    },
    [mutation, onProgress],
  );

  return {
    uploadFiles,
    isUploading: mutation.isPending,
    uploadProgress,
    clearUploadProgress: () => setUploadProgress([]),
  };
}

export { useDirectoryNodes, useCreateFolder, useDownloadFile, useDeleteNode } from "@/api/nodes";
export type { UploadProgress, Node };
