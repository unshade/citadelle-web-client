import { motion } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";

type AlertProps = {
  variant: "error" | "success";
  children: React.ReactNode;
};

const config = {
  error: {
    bg: "bg-red-500/20 border-red-500/30",
    icon: <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />,
    text: "text-red-200",
  },
  success: {
    bg: "bg-green-500/20 border-green-500/30",
    icon: <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />,
    text: "text-green-200",
  },
} as const;

export function Alert({ variant, children }: AlertProps) {
  const c = config[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${c.bg}`}
    >
      {c.icon}
      <span className={`text-sm ${c.text}`}>{children}</span>
    </motion.div>
  );
}
