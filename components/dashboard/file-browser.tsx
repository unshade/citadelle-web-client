import { motion } from "framer-motion";
import {
  Folder,
  File,
  Download,
  Eye,
  Trash2,
  Upload,
  Loader2,
  Lock,
} from "lucide-react";
import type { Node } from "@/lib/schemas";
import { canPreview } from "@/lib/previewers";

type FileBrowserProps = {
  nodes: Node[];
  decryptedNames: Record<string, string>;
  isLoading: boolean;
  isDragging: boolean;
  isUploading: boolean;
  downloadingNodeId: string | undefined;
  isDownloading: boolean;
  openingNodeId: string | undefined;
  isOpening: boolean;
  onNavigateFolder: (folderId: string, folderName: string) => void;
  onOpen: (nodeId: string) => void;
  onDownload: (nodeId: string) => void;
  onDelete: (node: Node) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export function FileBrowser({
  nodes,
  decryptedNames,
  isLoading,
  isDragging,
  isUploading,
  downloadingNodeId,
  isDownloading,
  openingNodeId,
  isOpening,
  onNavigateFolder,
  onOpen,
  onDownload,
  onDelete,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: FileBrowserProps) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`ice-glass-frost rounded-2xl p-8 transition-all duration-300 ${
        isDragging
          ? "border-2 border-dashed border-blue-400/50 bg-blue-500/10"
          : ""
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-300/60 animate-spin" />
        </div>
      ) : nodes.length === 0 && !isDragging && !isUploading ? (
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
          {nodes.map((node) => {
            const name = decryptedNames[node.Id] ?? "";
            const isBusy =
              (isDownloading && downloadingNodeId === node.Id) ||
              (isOpening && openingNodeId === node.Id);

            return (
              <motion.div
                key={node.Id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors relative group ${
                  isBusy ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onDelete(node)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-md text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 hover:!bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>

                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (node.IsDirectory) {
                      onNavigateFolder(node.Id, name || node.B64EncryptedPath);
                    } else if (canPreview(name)) {
                      onOpen(node.Id);
                    } else {
                      onDownload(node.Id);
                    }
                  }}
                >
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
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 text-blue-300 animate-spin absolute bottom-0 right-0" />
                      ) : canPreview(name) ? (
                        <Eye className="w-4 h-4 text-blue-300/0 group-hover:text-blue-300/60 transition-colors absolute bottom-0 right-0" />
                      ) : (
                        <Download className="w-4 h-4 text-blue-300/0 group-hover:text-blue-300/60 transition-colors absolute bottom-0 right-0" />
                      )}
                    </div>
                  )}
                  <p className="text-sm text-white/70 truncate">
                    {name || "..."}
                  </p>
                </div>
              </motion.div>
            );
          })}

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
  );
}
