"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Shield, 
  Folder, 
  File, 
  LogOut, 
  FolderPlus,
  Upload,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredCredentials, clearCredentials, clearAuthToken } from "@/lib/crypto";
import { nodeApi, Node } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(["root"]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const credentials = getStoredCredentials();
    if (!credentials) {
      router.push("/auth");
      return;
    }
    setUserId(credentials.userId);
    loadNodes();
  }, [router]);

  const loadNodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // For now, we assume a root directory exists
      // In a real app, you'd create/get the root directory first
      // This is a placeholder - in a real implementation, you'd need
      // to create a root directory for the user or handle this differently
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
          </motion.div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {currentPath.map((path, index) => (
            <span key={index} className="flex items-center gap-2">
              <span className={index === currentPath.length - 1 ? "text-white/80" : "text-blue-200/50"}>
                {path}
              </span>
              {index < currentPath.length - 1 && (
                <ChevronRight className="w-4 h-4 text-blue-200/30" />
              )}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-8">
          <Button className="btn-ice">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button className="btn-ice" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* File Grid */}
        <div className="ice-glass-frost rounded-2xl p-6">
          {nodes.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-blue-200/20 mx-auto mb-4" strokeWidth={1} />
              <h3 className="text-lg text-white/60 mb-2">No files yet</h3>
              <p className="text-sm text-blue-200/40">
                Create a folder or upload your first file
              </p>
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
                    {/* In real implementation, decrypt and display name */}
                    {node.Id.slice(0, 8)}...
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

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
      </main>
    </div>
  );
}
