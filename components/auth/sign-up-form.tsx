import { motion } from "framer-motion";
import { Key, Lock, Sparkles } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import type { SignUpFormData } from "@/lib/schemas";

type SignUpFormProps = {
  form: UseFormReturn<SignUpFormData>;
  showPassword: boolean;
  onTogglePassword: () => void;
  isPending: boolean;
  isLoading: boolean;
  onSubmit: (data: SignUpFormData) => void;
};

export function SignUpForm({
  form,
  showPassword,
  onTogglePassword,
  isPending,
  isLoading,
  onSubmit,
}: SignUpFormProps) {
  return (
    <motion.form
      key="signup"
      onSubmit={form.handleSubmit(onSubmit)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
          <Key className="w-3.5 h-3.5" strokeWidth={2} />
          Master Key
        </label>
        <PasswordInput
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          placeholder="Create master password"
          className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-[10px] text-red-300 ml-1 tracking-wide">
            {form.formState.errors.password.message}
          </p>
        ) : (
          <p className="text-[10px] text-blue-200/40 ml-1 tracking-wide">
            Min 8 characters. This encrypts all your data on this device.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
          <Lock className="w-3.5 h-3.5" strokeWidth={2} />
          Confirm
        </label>
        <Input
          type="password"
          placeholder="Verify password"
          className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-[10px] text-red-300 ml-1 tracking-wide">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

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
              INITIALIZE
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
