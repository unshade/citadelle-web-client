"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Sparkles, Shield, Key, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Pre-computed particle positions for SSR
const FROST_PARTICLES = [
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

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full arctic-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Frost Particles - Client Only */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {FROST_PARTICLES.map((particle, i) => (
            <motion.div
              key={`frost-${i}`}
              className="absolute frost-particle rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.3],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ice Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="ice-glass-strong rounded-2xl p-10 relative overflow-hidden glow-ice">
          {/* Ice Shimmer */}
          <motion.div
            className="absolute inset-0 ice-shimmer -skew-x-12"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />

          {/* Frost Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Logo / Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-xl ice-glass flex items-center justify-center border border-white/20">
                  <Shield className="w-8 h-8 text-blue-200" strokeWidth={1.5} />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-xl bg-blue-400/20 blur-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl font-light tracking-[0.15em] frost-text mb-3 font-serif">
                CITADELLE
              </h1>
              <p className="text-sm tracking-[0.3em] uppercase frost-text-subtle">
                Secure Storage
              </p>
            </motion.div>

            {/* Tab Buttons */}
            <div className="grid grid-cols-2 gap-1 mb-8 bg-black/20 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("signin")}
                className={`py-2.5 px-4 rounded-md transition-all duration-300 tracking-wide text-sm font-medium ${
                  activeTab === "signin"
                    ? "bg-white/10 text-white"
                    : "text-blue-200/60 hover:text-blue-200/80"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`py-2.5 px-4 rounded-md transition-all duration-300 tracking-wide text-sm font-medium ${
                  activeTab === "signup"
                    ? "bg-white/10 text-white"
                    : "text-blue-200/60 hover:text-blue-200/80"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "signin" ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* User ID Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Fingerprint className="w-3.5 h-3.5" strokeWidth={2} />
                      User ID
                    </label>
                    <Input
                      placeholder="Enter your user ID"
                      className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200/40 hover:text-blue-200/70 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <div className="pt-4">
                    <Button
                      className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                      AUTHENTICATE
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button className="text-xs text-blue-200/50 hover:text-blue-200/80 transition-colors tracking-wide">
                      Recovery Access
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Master Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Key className="w-3.5 h-3.5" strokeWidth={2} />
                      Master Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create master password"
                        className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200/40 hover:text-blue-200/70 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-blue-200/40 ml-1 tracking-wide">
                      This encrypts all your data on this device
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                      Confirm
                    </label>
                    <Input
                      type="password"
                      placeholder="Verify password"
                      className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
                    />
                  </div>

                  <Separator className="bg-white/5" />

                  {/* Challenge Word */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                      Challenge Phrase
                    </label>
                    <Input
                      placeholder="Secret phrase for authentication"
                      className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
                    />
                    <p className="text-[10px] text-blue-200/40 ml-1 tracking-wide">
                      Required for future authentication
                    </p>
                  </div>

                  {/* Sign Up Button */}
                  <div className="pt-4">
                    <Button
                      className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                      INITIALIZE
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-200/30" />
                <Shield className="w-3 h-3 text-blue-200/40" strokeWidth={2} />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-200/30" />
              </div>
              <p className="text-[10px] text-blue-200/30 tracking-[0.15em] uppercase">
                End-to-End Encrypted
              </p>
              <p className="text-[9px] text-blue-200/20 tracking-wider mt-1">
                Decryption occurs only on your device
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
