"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Sparkles, Shield, Key, Fingerprint, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { isAuthenticated, getStoredUserId, clearAuthToken, clearStoredUserId } from "@/lib/crypto";

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
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states - Sign In
  const [signInUserId, setSignInUserId] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  
  // Form states - Sign Up
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  
  // Session restore state
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const { signUp, signIn, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check for stored session
    if (isAuthenticated()) {
      const userId = getStoredUserId();
      if (userId) {
        setHasStoredSession(true);
        setStoredUserId(userId);
      }
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(null);

    if (signUpPassword !== signUpConfirmPassword) {
      return; // Handle error in UI
    }

    const result = await signUp(signUpPassword);
    
    if (result.success && result.userId) {
      setSuccess(`Account created! Your User ID is: ${result.userId}`);
      setActiveTab("signin");
      setSignInUserId(result.userId);
      // Clear form
      setSignUpPassword("");
      setSignUpConfirmPassword("");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const result = await signIn(signInUserId, signInPassword);
    
    if (result.success) {
      setSuccess("Authentication successful! Redirecting...");
      // Redirect to dashboard
      router.push("/dashboard");
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!storedUserId) return;
    
    setIsUnlocking(true);
    
    const result = await signIn(storedUserId, unlockPassword);
    
    if (result.success) {
      router.push("/dashboard");
    }
    
    setIsUnlocking(false);
  };

  const handleClearSession = () => {
    clearAuthToken();
    clearStoredUserId();
    setHasStoredSession(false);
    setStoredUserId(null);
    setUnlockPassword("");
  };

  return (
    <div className="min-h-screen w-full arctic-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Deep Frost Particles - More Subtle and Frozen */}
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
                y: [-20, -120],
                opacity: [0, 0.4, 0],
                scale: [0.3, 0.8, 0.2],
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

      {/* Deep Ambient Glows - Colder and More Subtle */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Deep Arctic Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="ice-glass-frost rounded-3xl p-12 relative overflow-hidden">
          {/* Multi-layer frosted background for depth */}
          <div className="absolute inset-0 backdrop-blur-[150px] bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.04),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(200,220,255,0.02),transparent_50%)]" />
          
          {/* Static Frost Border Effect - Subtle */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" 
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.15) 100%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Logo / Icon - Shield */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex justify-center mb-10"
            >
              <div className="w-20 h-20 rounded-2xl ice-glass-deep flex items-center justify-center border border-white/10">
                <Shield className="w-10 h-10 text-blue-300/70" strokeWidth={1} />
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
              /* Session Restore UI */
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
                    User: {storedUserId?.slice(0, 8)}...
                  </p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium tracking-wider text-blue-200/70 uppercase flex items-center gap-2 ml-1">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        placeholder="Enter your password to unlock"
                        className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm pr-12"
                        required
                        autoFocus
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

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUnlocking}
                      className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg disabled:opacity-50"
                    >
                      {isUnlocking ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
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
                    onClick={handleClearSession}
                    className="text-xs text-blue-200/40 hover:text-blue-200/70 transition-colors"
                  >
                    Use different account
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Tab Buttons - Darker Glass */}
                <div className="grid grid-cols-2 gap-1 mb-10 bg-black/30 border border-white/5 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setActiveTab("signin");
                      clearError();
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
                      clearError();
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

            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                  <span className="text-sm text-red-200">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                  <span className="text-sm text-green-200">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Content - only show when not in session restore mode */}
            {!hasStoredSession && (
            <AnimatePresence mode="wait">
              {activeTab === "signin" ? (
                <motion.form
                  key="signin"
                  onSubmit={handleSignIn}
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
                      value={signInUserId}
                      onChange={(e) => setSignInUserId(e.target.value)}
                      placeholder="Enter your user ID"
                      className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
                      required
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
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm pr-12"
                        required
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
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                          AUTHENTICATE
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button type="button" className="text-xs text-blue-200/50 hover:text-blue-200/80 transition-colors tracking-wide">
                      Recovery Access
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  onSubmit={handleSignUp}
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
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create master password"
                        className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm pr-12"
                        required
                        minLength={8}
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
                      Min 8 characters. This encrypts all your data on this device.
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
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Verify password"
                      className="ice-input text-blue-100 placeholder:text-blue-200/30 h-12 rounded-lg text-sm"
                      required
                    />
                    {signUpPassword && signUpConfirmPassword && signUpPassword !== signUpConfirmPassword && (
                      <p className="text-[10px] text-red-300 ml-1 tracking-wide">Passwords do not match</p>
                    )}
                  </div>

                  {/* Sign Up Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || signUpPassword !== signUpConfirmPassword}
                      className="w-full h-12 btn-ice text-white font-medium tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                          INITIALIZE
                        </>
                      )}
                    </Button>
                  </div>
                </motion.form>
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
