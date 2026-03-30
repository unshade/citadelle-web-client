"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import {
  useDirectoryNodes,
  useUploadFiles,
  useCreateFolder,
  useDownloadFile,
  useDeleteNode,
  useOpenFile,
  useFavouriteNodes,
} from "@/hooks/useFiles";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import type { DashboardView } from "@/components/dashboard/dashboard-sidebar";
import { FileBrowser } from "@/components/dashboard/file-browser";
import { UploadProgress } from "@/components/dashboard/upload-progress";
import { CreateFolderModal } from "@/components/dashboard/create-folder-modal";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import { FilePreviewModal } from "@/components/dashboard/file-preview-modal";

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
  const [view, setView] = useState<DashboardView>("files");
  const [pathStack, setPathStack] = useState<PathLevel[]>([
    { id: "root", name: "Home" },
  ]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [preview, setPreview] = useState<{ objectUrl: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const currentFolderId = pathStack[pathStack.length - 1]?.id || "root";

  const filesQuery = useDirectoryNodes(currentFolderId);
  const favouritesQuery = useFavouriteNodes();

  const activeNodes = view === "files"
    ? (filesQuery.data ?? [])
    : (favouritesQuery.data ?? []);
  const isLoadingNodes = view === "files" ? filesQuery.isLoading : favouritesQuery.isLoading;

  const decryptedNames = useDecryptedNames(activeNodes);

  const { uploadFiles, isUploading, uploadProgress, clearUploadProgress } =
    useUploadFiles(currentFolderId);
  const createFolderMutation = useCreateFolder(currentFolderId);
  const deleteNode = useDeleteNode(currentFolderId);
  const downloadFile = useDownloadFile();
  const openFile = useOpenFile();
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

  const navigateToFolder = useCallback((folderId: string, folderName: string) => {
    // Always switch to files view when navigating into a folder
    setView("files");
    setPathStack((prev) => [...prev, { id: folderId, name: folderName }]);
  }, []);

  const navigateToPath = (index: number) => {
    setPathStack((prev) => prev.slice(0, index + 1));
  };

  const handleViewChange = (next: DashboardView) => {
    setView(next);
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
        setError(err instanceof Error ? err.message : "Upload failed");
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
      setError(err instanceof Error ? err.message : "Upload failed");
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
      setError(err instanceof Error ? err.message : "Failed to create folder");
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

  const handleOpen = async (nodeId: string) => {
    try {
      setError(null);
      const result = await openFile.mutateAsync(nodeId);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open file");
    }
  };

  const handleClosePreview = () => {
    if (preview) URL.revokeObjectURL(preview.objectUrl);
    setPreview(null);
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
    <div className="flex h-screen arctic-bg overflow-hidden">
      <DashboardSidebar
        activeView={view}
        onViewChange={handleViewChange}
        userId={userId}
        onLogout={handleLogout}
      />

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 border-b border-white/[0.05] px-6 py-3 flex items-center justify-between gap-4 backdrop-blur-sm bg-black/10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            {view === "files" ? (
              pathStack.map((level, index) => (
                <span key={level.id} className="flex items-center gap-2 min-w-0">
                  <span
                    onClick={() => navigateToPath(index)}
                    className={
                      index === pathStack.length - 1
                        ? "text-white/70"
                        : "text-white/30 cursor-pointer hover:text-white/55 transition-colors"
                    }
                  >
                    {level.name}
                  </span>
                  {index < pathStack.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  )}
                </span>
              ))
            ) : (
              <span className="text-white/70">Favourites</span>
            )}
          </div>

          {/* Actions */}
          {view === "files" && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                className="btn-ice text-white/80 h-8 text-xs px-3"
                disabled={isUploading || createFolderMutation.isPending}
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
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
                className="btn-ice h-8 text-xs px-3"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isUploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          )}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {(error || filesQuery.error || favouritesQuery.error) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="shrink-0 mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-200 flex-1">
                {error || filesQuery.error?.message || favouritesQuery.error?.message}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <FileBrowser
            nodes={activeNodes}
            decryptedNames={decryptedNames}
            isLoading={isLoadingNodes}
            isDragging={isDragging && view === "files"}
            isUploading={isUploading}
            downloadingNodeId={downloadFile.variables}
            isDownloading={downloadFile.isPending}
            openingNodeId={openFile.variables}
            isOpening={openFile.isPending}
            onNavigateFolder={navigateToFolder}
            onOpen={handleOpen}
            onDownload={handleDownload}
            onDelete={setNodeToDelete}
            onDragEnter={view === "files" ? handleDragEnter : () => {}}
            onDragLeave={view === "files" ? handleDragLeave : () => {}}
            onDragOver={view === "files" ? handleDragOver : () => {}}
            onDrop={view === "files" ? handleDrop : () => {}}
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
        </main>
      </div>

      <AnimatePresence>
        {preview && (
          <FilePreviewModal
            objectUrl={preview.objectUrl}
            filename={preview.fileName}
            onClose={handleClosePreview}
          />
        )}
      </AnimatePresence>

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
    </div>
  );
}
