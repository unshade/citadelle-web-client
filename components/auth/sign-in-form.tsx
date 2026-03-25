import { motion } from "framer-motion";
import { Fingerprint, Lock, Sparkles } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import type { SignInFormData } from "@/lib/schemas";

type SignInFormProps = {
  form: UseFormReturn<SignInFormData>;
  showPassword: boolean;
  onTogglePassword: () => void;
  isPending: boolean;
  isLoading: boolean;
  onSubmit: (data: SignInFormData) => void;
};

export function SignInForm({
  form,
  showPassword,
  onTogglePassword,
  isPending,
  isLoading,
  onSubmit,
}: SignInFormProps) {
  return (
    <motion.form
      key="signin"
      onSubmit={form.handleSubmit(onSubmit)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
          <Fingerprint className="w-3.5 h-3.5" strokeWidth={2} />
          User ID
        </label>
        <Input
          placeholder="Enter your user ID"
          className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
          {...form.register("userId")}
        />
        {form.formState.errors.userId && (
          <p className="text-[10px] text-red-300 ml-1 tracking-wide">
            {form.formState.errors.userId.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
          <Lock className="w-3.5 h-3.5" strokeWidth={2} />
          Password
        </label>
        <PasswordInput
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          placeholder="Enter your password"
          className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
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

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Spinner />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
              AUTHENTICATE
            </>
          )}
        </Button>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          className="text-xs text-blue-200/50 hover:text-blue-200/80 transition-colors tracking-wide"
        >
          Recovery Access
        </button>
      </div>
    </motion.form>
  );
}
