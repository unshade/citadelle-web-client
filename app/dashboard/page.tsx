"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Folder, 
  File, 
  LogOut, 
  FolderPlus,
  Upload,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredCredentials, clearCredentials, clearAuthToken } from "@/lib/crypto";
import { Node } from "@/lib/api";
import { useFiles } from "@/hooks/useFiles";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(["root"]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const { uploadFiles, createFolder, uploadProgress, isUploading, clearUploadProgress, loadNodes } = useFiles();

  useEffect(() => {
    const credentials = getStoredCredentials();
    if (!credentials) {
      router.push("/auth");
      return;
    }
    setUserId(credentials.userId);
    loadUserNodes();
  }, [router]);

  const loadUserNodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Load root nodes (parent = "root")
      const userNodes = await loadNodes("root");
      setNodes(userNodes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load files";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearCredentials();
    clearAuthToken();
    router.push("/auth");
  };

  // Drag and drop handlers
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      setError(null);
      await uploadFiles(files, "root");
      // Reload nodes after upload
      await loadUserNodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    }
  }, [uploadFiles, loadUserNodes]);

  // File input handler for click-to-upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setError(null);
      await uploadFiles(files, "root");
      await loadUserNodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      setIsCreatingFolder(true);
      setError(null);
      const currentParentId = currentPath[currentPath.length - 1];
      await createFolder(newFolderName.trim(), currentParentId === 'root' ? 'root' : currentParentId);
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      await loadUserNodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create folder";
      setError(message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  if (isLoading) {
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
              <Shield className="w-5 h-5 text-blue-300/70" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-light tracking-wider text-white/90">CITADELLE</h1>
              <p className="text-xs text-blue-200/40 tracking-wider">Secure File Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userId && (
              <span className="text-xs text-blue-200/50 tracking-wider px-3 py-1 rounded-full bg-white/5">
                User: {userId.slice(0, 8)}...
              </span>
            )}
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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-200">{error}</span>
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
          {currentPath.map((path, index) => (
            <span key={index} className="flex items-center gap-2">
              <span className={index === currentPath.length - 1 ? "text-white/80" : "text-blue-200/50 cursor-pointer hover:text-blue-200/80"}>
                {path === "root" ? "Home" : path}
              </span>
              {index < currentPath.length - 1 && (
                <ChevronRight className="w-4 h-4 text-blue-200/30" />
              )}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            className="btn-ice" 
            disabled={isUploading || isCreatingFolder}
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <div className="relative">
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isUploading}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button className="btn-ice" variant="outline" disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </label>
          </div>
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
          {nodes.length === 0 && !isDragging && !isUploading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-blue-200/40" strokeWidth={1} />
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
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 cursor-pointer transition-colors"
                >
                  {node.IsDirectory ? (
                    <Folder className="w-12 h-12 text-blue-300/60 mb-3" strokeWidth={1.5} />
                  ) : (
                    <File className="w-12 h-12 text-blue-200/40 mb-3" strokeWidth={1.5} />
                  )}
                  <p className="text-sm text-white/70 truncate">
                    {node.B64EncryptedPath}
                  </p>
                </motion.div>
              ))}
              
              {/* Drop indicator */}
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full border-2 border-dashed border-blue-400/50 rounded-xl p-8 text-center bg-blue-500/10"
                >
                  <Upload className="w-8 h-8 text-blue-300/60 mx-auto mb-2" />
                  <p className="text-blue-200/60">Drop files here to upload</p>
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
                <h3 className="text-sm font-medium text-white/80">Upload Progress</h3>
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
                        {progress.status === 'completed' && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                        {progress.status === 'error' && (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <span className={
                        progress.status === 'error' ? 'text-red-400' :
                        progress.status === 'completed' ? 'text-green-400' :
                        'text-blue-200/50'
                      }>
                        {progress.status === 'encrypting' && 'Encrypting...'}
                        {progress.status === 'uploading' && 'Uploading...'}
                        {progress.status === 'completed' && 'Done'}
                        {progress.status === 'error' && progress.error || 'Error'}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          progress.status === 'error' ? 'bg-red-500' :
                          progress.status === 'completed' ? 'bg-green-500' :
                          'bg-blue-400'
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
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        handleCreateFolder();
                      }
                      if (e.key === 'Escape') {
                        setIsCreateFolderOpen(false);
                      }
                    }}
                    autoFocus
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setNewFolderName("");
                        setIsCreateFolderOpen(false);
                      }}
                      disabled={isCreatingFolder}
                      className="text-blue-200/60 hover:text-blue-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || isCreatingFolder}
                      className="btn-ice"
                    >
                      {isCreatingFolder ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
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
