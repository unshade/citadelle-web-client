import { motion } from "framer-motion";

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`border-2 border-white/30 border-t-white rounded-full ${className}`}
    />
  );
}
