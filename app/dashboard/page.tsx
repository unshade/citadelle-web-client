"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Folder,
  File,
  LogOut,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getStoredCredentials, clearCredentials, clearAuthToken } from "@/lib/storage";
import { decryptName } from "@/lib/crypto";
import { createFolderFormSchema } from "@/lib/schemas";
import type { CreateFolderFormData, Node } from "@/lib/schemas";
import { useDirectoryNodes, useUploadFiles, useCreateFolder, useDownloadFile, useDeleteNode } from "@/hooks/useFiles";

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
          result[node.Id] = await decryptName(node.EncryptedName);
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
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
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

  if (!userId) {
    return (
      <div className="min-h-screen arctic-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-300/30 border-t-blue-300 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen arctic-bg">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl ice-glass-deep flex items-center justify-center border border-white/10">
              <Shield
                className="w-5 h-5 text-blue-300/70"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h1 className="text-lg font-light tracking-wider text-white/90">
                CITADELLE
              </h1>
              <p className="text-xs text-blue-200/40 tracking-wider">
                Secure File Storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-blue-200/50 tracking-wider px-3 py-1 rounded-full bg-white/5">
              User: {userId.slice(0, 8)}...
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-blue-200/60 hover:text-blue-200 hover:bg-white/5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`ice-glass-frost rounded-2xl p-8 transition-all duration-300 ${
            isDragging
              ? "border-2 border-dashed border-blue-400/50 bg-blue-500/10"
              : ""
          }`}
        >
          {nodesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-300/60 animate-spin" />
            </div>
          ) : nodes.length === 0 && !isDragging && !isUploading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                <Upload
                  className="w-10 h-10 text-blue-200/40"
                  strokeWidth={1}
                />
              </div>
              <h3 className="text-lg text-white/60 mb-2">Drop files here</h3>
              <p className="text-sm text-blue-200/40">
                Drag and drop files, or click Upload File to browse
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-blue-200/30">
                <Lock className="w-3 h-3" />
                <span>All files are encrypted before upload</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {nodes.map((node) => (
                <motion.div
                  key={node.Id}
                  whileHover={{ scale: 1.02 }}
                  onClick={async () => {
                    if (node.IsDirectory) {
                      const name =
                        decryptedNames[node.Id] ?? node.B64EncryptedPath;
                      navigateToFolder(node.Id, name);
                    } else {
                      try {
                        setError(null);
                        await downloadFile.mutateAsync(node.Id);
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Download failed",
                        );
                      }
                    }
                  }}
                  className={`p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 cursor-pointer transition-colors relative group ${
                    downloadFile.isPending &&
                    downloadFile.variables === node.Id
                      ? "opacity-60 pointer-events-none"
                      : ""
                  }`}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNodeToDelete(node);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>

                  {node.IsDirectory ? (
                    <Folder
                      className="w-12 h-12 text-blue-300/60 mb-3"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <div className="relative mb-3">
                      <File
                        className="w-12 h-12 text-blue-200/40"
                        strokeWidth={1.5}
                      />
                      {downloadFile.isPending &&
                      downloadFile.variables === node.Id ? (
                        <Loader2 className="w-4 h-4 text-blue-300 animate-spin absolute bottom-0 right-0" />
                      ) : (
                        <Download className="w-4 h-4 text-blue-300/0 group-hover:text-blue-300/60 transition-colors absolute bottom-0 right-0" />
                      )}
                    </div>
                  )}
                  <p className="text-sm text-white/70 truncate">
                    {decryptedNames[node.Id] ?? "..."}
                  </p>
                </motion.div>
              ))}

              {isDragging && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full border-2 border-dashed border-blue-400/50 rounded-xl p-8 text-center bg-blue-500/10"
                >
                  <Upload className="w-8 h-8 text-blue-300/60 mx-auto mb-2" />
                  <p className="text-blue-200/60">
                    Drop files here to upload
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploadProgress.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 ice-glass-frost rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">
                  Upload Progress
                </h3>
                <button
                  onClick={clearUploadProgress}
                  className="text-xs text-blue-200/50 hover:text-blue-200/80"
                  disabled={isUploading}
                >
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-white/70 truncate max-w-[200px]">
                          {progress.fileName}
                        </span>
                        {progress.status === "completed" && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                        {progress.status === "error" && (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <span
                        className={
                          progress.status === "error"
                            ? "text-red-400"
                            : progress.status === "completed"
                              ? "text-green-400"
                              : "text-blue-200/50"
                        }
                      >
                        {progress.status === "encrypting" && "Encrypting..."}
                        {progress.status === "uploading" && "Uploading..."}
                        {progress.status === "completed" && "Done"}
                        {progress.status === "error" &&
                          (progress.error || "Error")}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          progress.status === "error"
                            ? "bg-red-500"
                            : progress.status === "completed"
                              ? "bg-green-500"
                              : "bg-blue-400"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Panel */}
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

        {/* Create Folder Modal */}
        <AnimatePresence>
          {isCreateFolderOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="ice-glass-deep p-6 w-96 border border-white/10">
                  <h3 className="text-lg font-medium text-white/90 mb-4">
                    Create New Folder
                  </h3>
                  <form onSubmit={folderForm.handleSubmit(handleCreateFolder)}>
                    <Input
                      placeholder="Folder name"
                      autoFocus
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsCreateFolderOpen(false);
                        }
                      }}
                      {...folderForm.register("folderName")}
                    />
                    {folderForm.formState.errors.folderName && (
                      <p className="text-[10px] text-red-300 ml-1 mt-1 tracking-wide">
                        {folderForm.formState.errors.folderName.message}
                      </p>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          folderForm.reset();
                          setIsCreateFolderOpen(false);
                        }}
                        disabled={createFolderMutation.isPending}
                        className="text-blue-200/60 hover:text-blue-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFolderMutation.isPending}
                        className="btn-ice text-white/90"
                      >
                        {createFolderMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {nodeToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setNodeToDelete(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="ice-glass-deep p-6 w-96 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white/90">
                        Delete {nodeToDelete.IsDirectory ? "folder" : "file"}
                      </h3>
                      <p className="text-xs text-blue-200/40">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-200/60 mb-1">
                    Are you sure you want to delete{" "}
                    <span className="text-white/80 font-medium">
                      {decryptedNames[nodeToDelete.Id] ?? "this item"}
                    </span>
                    ?
                  </p>
                  {nodeToDelete.IsDirectory && (
                    <p className="text-xs text-red-300/60">
                      All files and subfolders inside will also be deleted.
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setNodeToDelete(null)}
                      disabled={deleteNode.isPending}
                      className="text-blue-200/60 hover:text-blue-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={deleteNode.isPending}
                      className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                      onClick={async () => {
                        try {
                          setError(null);
                          await deleteNode.mutateAsync(nodeToDelete.Id);
                          setNodeToDelete(null);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Delete failed",
                          );
                          setNodeToDelete(null);
                        }
                      }}
                    >
                      {deleteNode.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
