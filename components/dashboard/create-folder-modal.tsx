import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { CreateFolderFormData } from "@/lib/schemas";

type CreateFolderModalProps = {
  form: UseFormReturn<CreateFolderFormData>;
  isPending: boolean;
  onSubmit: (data: CreateFolderFormData) => void;
  onClose: () => void;
};

export function CreateFolderModal({
  form,
  isPending,
  onSubmit,
  onClose,
}: CreateFolderModalProps) {
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-medium text-white/90 mb-4">
        Create New Folder
      </h3>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Input
          placeholder="Folder name"
          autoFocus
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          {...form.register("folderName")}
        />
        {form.formState.errors.folderName && (
          <p className="text-[10px] text-red-300 ml-1 mt-1 tracking-wide">
            {form.formState.errors.folderName.message}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              onClose();
            }}
            disabled={isPending}
            className="text-blue-200/60 hover:text-blue-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="btn-ice text-white/90"
          >
            {isPending ? (
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
    </Modal>
  );
}
