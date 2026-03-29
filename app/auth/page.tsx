"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  signInFormSchema,
  signUpFormSchema,
  unlockFormSchema,
} from "@/lib/schemas";
import type {
  SignInFormData,
  SignUpFormData,
  UnlockFormData,
} from "@/lib/schemas";
import { FrostParticles } from "@/components/auth/frost-particles";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { UnlockForm } from "@/components/auth/unlock-form";
import { Alert } from "@/components/ui/alert";

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    signUp,
    signIn,
    clearSession,
    hasStoredSession,
    storedUserId,
    rememberMe,
  } = useAuth();
  const router = useRouter();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { userId: "", password: "", rememberMe: false },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const unlockForm = useForm<UnlockFormData>({
    resolver: zodResolver(unlockFormSchema),
    defaultValues: { password: "", rememberMe },
  });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const error =
    signUp.error?.message ?? signIn.error?.message ?? null;
  const isLoading = signUp.isPending || signIn.isPending;

  const handleSignUp = async (data: SignUpFormData) => {
    setSuccess(null);
    const result = await signUp.mutateAsync(data);

    if (result.success && result.userId) {
      setSuccess(`Account created! Your User ID is: ${result.userId}`);
      setActiveTab("signin");
      signInForm.setValue("userId", result.userId);
      signUpForm.reset();
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setSuccess(null);
    const result = await signIn.mutateAsync(data);

    if (result.success) {
      setSuccess("Authentication successful! Redirecting...");
      router.push("/dashboard");
    }
  };

  const handleUnlock = async (data: UnlockFormData) => {
    if (!storedUserId) return;

    const result = await signIn.mutateAsync({
      userId: storedUserId,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.success) {
      router.push("/dashboard");
    }
  };

  const handleClearSession = () => {
    clearSession();
    unlockForm.reset();
  };

  const togglePassword = () => setShowPassword((v) => !v);

  return (
    <div className="min-h-screen w-full arctic-bg flex items-center justify-center p-4 relative overflow-hidden">
      {mounted && <FrostParticles />}

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="ice-glass-frost rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-[150px] bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.04),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(200,220,255,0.02),transparent_50%)]" />

          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.15) 100%)",
            }}
          />

          <div className="relative z-10">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="flex justify-center mb-10"
            >
              <div className="w-20 h-20 rounded-2xl ice-glass-deep flex items-center justify-center border border-white/10">
                <Shield
                  className="w-10 h-10 text-blue-300/70"
                  strokeWidth={1}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-2xl font-light tracking-[0.25em] text-white/90 mb-4">
                CITADELLE
              </h1>
              <p className="text-xs tracking-[0.4em] uppercase frost-text-subtle">
                End-to-End Encrypted
              </p>
            </motion.div>

            {hasStoredSession ? (
              <UnlockForm
                form={unlockForm}
                storedUserId={storedUserId!}
                showPassword={showPassword}
                onTogglePassword={togglePassword}
                isPending={signIn.isPending}
                onSubmit={handleUnlock}
                onClearSession={handleClearSession}
              />
            ) : (
              <>
                {/* Tab Buttons */}
                <div className="grid grid-cols-2 gap-1 mb-10 bg-black/30 border border-white/5 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setActiveTab("signin");
                      signUp.reset();
                      signIn.reset();
                      setSuccess(null);
                    }}
                    className={`py-2.5 px-4 rounded-md transition-all duration-300 tracking-wide text-sm font-medium ${
                      activeTab === "signin"
                        ? "bg-white/10 text-white"
                        : "text-blue-200/60 hover:text-blue-200/80"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("signup");
                      signUp.reset();
                      signIn.reset();
                      setSuccess(null);
                    }}
                    className={`py-2.5 px-4 rounded-md transition-all duration-300 tracking-wide text-sm font-medium ${
                      activeTab === "signup"
                        ? "bg-white/10 text-white"
                        : "text-blue-200/60 hover:text-blue-200/80"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </>
            )}

            {/* Error / Success */}
            <AnimatePresence>
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
            </AnimatePresence>

            {/* Tab Content */}
            {!hasStoredSession && (
              <AnimatePresence mode="wait">
                {activeTab === "signin" ? (
                  <SignInForm
                    form={signInForm}
                    showPassword={showPassword}
                    onTogglePassword={togglePassword}
                    isPending={signIn.isPending}
                    isLoading={isLoading}
                    onSubmit={handleSignIn}
                  />
                ) : (
                  <SignUpForm
                    form={signUpForm}
                    showPassword={showPassword}
                    onTogglePassword={togglePassword}
                    isPending={signUp.isPending}
                    isLoading={isLoading}
                    onSubmit={handleSignUp}
                  />
                )}
              </AnimatePresence>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-200/30" />
                <Shield
                  className="w-3 h-3 text-blue-200/40"
                  strokeWidth={2}
                />
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
