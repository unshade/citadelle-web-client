import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import type { UnlockFormData } from "@/lib/schemas";

type UnlockFormProps = {
  form: UseFormReturn<UnlockFormData>;
  storedUserId: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  isPending: boolean;
  onSubmit: (data: UnlockFormData) => void;
  onClearSession: () => void;
};

export function UnlockForm({
  form,
  storedUserId,
  showPassword,
  onTogglePassword,
  isPending,
  onSubmit,
  onClearSession,
}: UnlockFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-blue-300/60" strokeWidth={1.5} />
        </div>
        <h3 className="text-white/90 text-lg mb-1">Welcome back</h3>
        <p className="text-sm text-blue-200/40">
          User: {storedUserId.slice(0, 8)}...
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
            <Lock className="w-3.5 h-3.5" strokeWidth={2} />
            Password
          </label>
          <PasswordInput
            showPassword={showPassword}
            onTogglePassword={onTogglePassword}
            placeholder="Enter your password to unlock"
            className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
            autoFocus
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-[10px] text-red-300 ml-1 tracking-wide">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 ml-1 cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-blue-400"
            {...form.register("rememberMe")}
          />
          <span className="text-xs text-blue-200/50">Stay connected on this tab</span>
        </label>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg disabled:opacity-50"
          >
            {isPending ? (
              <Spinner />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" strokeWidth={2} />
                UNLOCK SESSION
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onClearSession}
          className="text-xs text-blue-200/40 hover:text-blue-200/70 transition-colors"
        >
          Use different account
        </button>
      </div>
    </motion.div>
  );
}
