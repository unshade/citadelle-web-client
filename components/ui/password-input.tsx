import { forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  showPassword: boolean;
  onTogglePassword: () => void;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ showPassword, onTogglePassword, className, ...props }, ref) {
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={`pr-12 ${className ?? ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200/40 hover:text-blue-200/70 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Eye className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
      </div>
    );
  },
);
