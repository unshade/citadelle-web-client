import { motion } from "framer-motion";
import { X, Download } from "lucide-react";
import { findPreviewer } from "@/lib/previewers";

type FilePreviewModalProps = {
  objectUrl: string;
  filename: string;
  onClose: () => void;
};

export function FilePreviewModal({ objectUrl, filename, onClose }: FilePreviewModalProps) {
  const previewer = findPreviewer(filename);
  if (!previewer) return null;

  const { Component } = previewer;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm text-white/60 truncate max-w-[calc(100%-6rem)]">{filename}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Previewer content */}
        <Component objectUrl={objectUrl} filename={filename} />
      </motion.div>
    </motion.div>
  );
}
