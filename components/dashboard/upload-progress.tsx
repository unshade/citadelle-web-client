import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { UploadProgress as UploadProgressItem } from "@/hooks/useFiles";

type UploadProgressProps = {
  items: UploadProgressItem[];
  isUploading: boolean;
  onClear: () => void;
};

export function UploadProgress({ items, isUploading, onClear }: UploadProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-6 ice-glass-frost rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/80">Upload Progress</h3>
        <button
          onClick={onClear}
          className="text-xs text-blue-200/50 hover:text-blue-200/80"
          disabled={isUploading}
        >
          Clear
        </button>
      </div>
      <div className="space-y-3">
        {items.map((progress, index) => (
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
                {progress.status === "error" && (progress.error || "Error")}
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
  );
}
