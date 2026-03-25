import { motion } from "framer-motion";

const PARTICLES = [
  { x: 8, y: 15, delay: 0, duration: 12, size: 3 },
  { x: 92, y: 20, delay: 1.5, duration: 10, size: 2 },
  { x: 25, y: 75, delay: 2.5, duration: 14, size: 4 },
  { x: 75, y: 65, delay: 0.8, duration: 11, size: 2 },
  { x: 45, y: 25, delay: 2, duration: 13, size: 3 },
  { x: 18, y: 55, delay: 3.5, duration: 9, size: 2 },
  { x: 85, y: 35, delay: 1.2, duration: 12, size: 3 },
  { x: 35, y: 80, delay: 0.5, duration: 10, size: 2 },
  { x: 65, y: 15, delay: 2.8, duration: 11, size: 4 },
  { x: 12, y: 65, delay: 1.8, duration: 13, size: 2 },
  { x: 88, y: 50, delay: 3, duration: 9, size: 3 },
  { x: 30, y: 35, delay: 0.3, duration: 14, size: 2 },
  { x: 72, y: 80, delay: 2.2, duration: 10, size: 3 },
  { x: 50, y: 45, delay: 1, duration: 12, size: 2 },
  { x: 55, y: 90, delay: 3.5, duration: 11, size: 3 },
  { x: 42, y: 10, delay: 0.8, duration: 13, size: 2 },
  { x: 95, y: 70, delay: 2.5, duration: 10, size: 4 },
  { x: 5, y: 40, delay: 1.5, duration: 12, size: 2 },
];

export function FrostParticles() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={`frost-${i}`}
            className="absolute frost-particle rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [-20, -120], opacity: [0, 0.4, 0], scale: [0.3, 0.8, 0.2] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />
    </>
  );
}
