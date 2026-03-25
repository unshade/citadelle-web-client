import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Node } from "@/lib/schemas";

type DeleteConfirmModalProps = {
  node: Node;
  decryptedName: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteConfirmModal({
  node,
  decryptedName,
  isPending,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white/90">
            Delete {node.IsDirectory ? "folder" : "file"}
          </h3>
          <p className="text-xs text-blue-200/40">
            This action cannot be undone
          </p>
        </div>
      </div>
      <p className="text-sm text-blue-200/60 mb-1">
        Are you sure you want to delete{" "}
        <span className="text-white/80 font-medium">{decryptedName}</span>?
      </p>
      {node.IsDirectory && (
        <p className="text-xs text-red-300/60">
          All files and subfolders inside will also be deleted.
        </p>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isPending}
          className="text-blue-200/60 hover:text-blue-200"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isPending}
          className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
          onClick={onConfirm}
        >
          {isPending ? (
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
    </Modal>
  );
}
