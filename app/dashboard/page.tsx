"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FolderPlus,
  Upload,
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getStoredCredentials, clearCredentials, clearAuthToken } from "@/lib/storage";
import { decryptString } from "@/lib/crypto";
import { createFolderFormSchema } from "@/lib/schemas";
import type { CreateFolderFormData, Node } from "@/lib/schemas";
import { useDirectoryNodes, useUploadFiles, useCreateFolder, useDownloadFile, useDeleteNode } from "@/hooks/useFiles";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FileBrowser } from "@/components/dashboard/file-browser";
import { UploadProgress } from "@/components/dashboard/upload-progress";
import { CreateFolderModal } from "@/components/dashboard/create-folder-modal";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";

type PathLevel = {
  id: string;
  name: string;
};

function useDecryptedNames(nodes: Node[]) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function decrypt() {
      const result: Record<string, string> = {};
      for (const node of nodes) {
        try {
          result[node.Id] = await decryptString({ nonce: node.NameNonce, ciphertext: node.EncryptedName });
        } catch {
          result[node.Id] = node.B64EncryptedPath;
        }
      }
      if (!cancelled) setNames(result);
    }

    if (nodes.length > 0) decrypt();
    return () => { cancelled = true; };
  }, [nodes]);

  return names;
}

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<PathLevel[]>([
    { id: "root", name: "Home" },
  ]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const currentFolderId = pathStack[pathStack.length - 1]?.id || "root";

  const nodesQuery = useDirectoryNodes(currentFolderId);
  const nodes = nodesQuery.data ?? [];
  const decryptedNames = useDecryptedNames(nodes);

  const { uploadFiles, isUploading, uploadProgress, clearUploadProgress } =
    useUploadFiles(currentFolderId);
  const createFolderMutation = useCreateFolder(currentFolderId);
  const deleteNode = useDeleteNode(currentFolderId);
  const downloadFile = useDownloadFile();
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);

  const folderForm = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderFormSchema),
    defaultValues: { folderName: "" },
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      const credentials = getStoredCredentials();
      if (!credentials) {
        router.push("/auth");
        return;
      }
      setUserId(credentials.userId);
    });
  }, [router]);

  const navigateToFolder = (folderId: string, folderName: string) => {
    setPathStack((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const navigateToPath = (index: number) => {
    setPathStack((prev) => prev.slice(0, index + 1));
  };

  const handleLogout = () => {
    clearCredentials();
    clearAuthToken();
    router.push("/auth");
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        setError(null);
        await uploadFiles(files);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
      }
    },
    [uploadFiles],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setError(null);
      await uploadFiles(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    }

    e.target.value = "";
  };

  const handleCreateFolder = async (data: CreateFolderFormData) => {
    try {
      setError(null);
      await createFolderMutation.mutateAsync(data.folderName);
      folderForm.reset();
      setIsCreateFolderOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create folder";
      setError(message);
    }
  };

  const handleDownload = async (nodeId: string) => {
    try {
      setError(null);
      await downloadFile.mutateAsync(nodeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!nodeToDelete) return;
    try {
      setError(null);
      await deleteNode.mutateAsync(nodeToDelete.Id);
      setNodeToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setNodeToDelete(null);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen arctic-bg flex items-center justify-center">
        <Spinner className="w-8 h-8 border-blue-300/30 border-t-blue-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen arctic-bg">
      <DashboardHeader userId={userId} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {(error || nodesQuery.error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-200">
              {error || nodesQuery.error?.message}
            </span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {pathStack.map((level, index) => (
            <span key={level.id} className="flex items-center gap-2">
              <span
                onClick={() => navigateToPath(index)}
                className={
                  index === pathStack.length - 1
                    ? "text-white/80"
                    : "text-blue-200/50 cursor-pointer hover:text-blue-200/80"
                }
              >
                {level.name}
              </span>
              {index < pathStack.length - 1 && (
                <ChevronRight className="w-4 h-4 text-blue-200/30" />
              )}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            className="btn-ice text-white/90"
            disabled={isUploading || createFolderMutation.isPending}
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            className="btn-ice"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>

        <FileBrowser
          nodes={nodes}
          decryptedNames={decryptedNames}
          isLoading={nodesQuery.isLoading}
          isDragging={isDragging}
          isUploading={isUploading}
          downloadingNodeId={downloadFile.variables}
          isDownloading={downloadFile.isPending}
          onNavigateFolder={navigateToFolder}
          onDownload={handleDownload}
          onDelete={setNodeToDelete}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />

        <AnimatePresence>
          {uploadProgress.length > 0 && (
            <UploadProgress
              items={uploadProgress}
              isUploading={isUploading}
              onClear={clearUploadProgress}
            />
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-200/40" strokeWidth={2} />
            <span className="text-xs text-blue-200/40 tracking-wider">
              End-to-End Encrypted
            </span>
          </div>
          <p className="text-[10px] text-blue-200/20 tracking-wider">
            All files are encrypted on your device before being uploaded
          </p>
        </div>

        <AnimatePresence>
          {isCreateFolderOpen && (
            <CreateFolderModal
              form={folderForm}
              isPending={createFolderMutation.isPending}
              onSubmit={handleCreateFolder}
              onClose={() => setIsCreateFolderOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {nodeToDelete && (
            <DeleteConfirmModal
              node={nodeToDelete}
              decryptedName={decryptedNames[nodeToDelete.Id] ?? "this item"}
              isPending={deleteNode.isPending}
              onConfirm={handleDeleteConfirm}
              onClose={() => setNodeToDelete(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
