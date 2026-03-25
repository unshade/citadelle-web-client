import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ onClose, children, className }: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          className={`ice-glass-deep p-6 w-96 border border-white/10 ${className ?? ""}`}
        >
          {children}
        </Card>
      </motion.div>
    </motion.div>
  );
}
