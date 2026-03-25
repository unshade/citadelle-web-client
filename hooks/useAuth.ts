"use client";

/**
 * Auth hook — orchestrates sign-up/sign-in flows and session state.
 * Delegates API calls to api/auth.ts mutations; manages storage side effects.
 */
import { useState, useEffect } from "react";
import { useSignUpMutation, useSignInMutation } from "@/api/auth";
import {
  storeCredentials,
  setAuthToken,
  setRememberMe,
  clearCredentials,
  clearAuthToken,
  getStoredUserId,
  setStoredUserId,
  clearStoredUserId,
  isAuthenticated,
  getRememberMe,
} from "@/lib/storage";
import type { SignInFormData, SignUpFormData } from "@/lib/schemas";

type AuthResult = { success: boolean; userId?: string; error?: string };

export function useAuth() {
  // SSR-safe defaults; hydrated from storage on mount
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [storedUserId, setStoredUserIdState] = useState<string | null>(null);
  const [rememberMe, setRememberMeState] = useState(false);

  useEffect(() => {
    // Deferred to avoid React 19 "setState in effect" lint rule
    requestAnimationFrame(() => {
      setHasStoredSession(isAuthenticated());
      setStoredUserIdState(getStoredUserId());
      setRememberMeState(getRememberMe());
    });
  }, []);

  const signUpApi = useSignUpMutation();
  const signInApi = useSignInMutation();

  const signUp = {
    ...signUpApi,
    mutateAsync: async (data: SignUpFormData): Promise<AuthResult> => {
      const result = await signUpApi.mutateAsync(data);
      storeCredentials(result);
      return { success: true, userId: result.userId };
    },
  };

  const signIn = {
    ...signInApi,
    mutateAsync: async (data: SignInFormData): Promise<AuthResult> => {
      // Persist remember-me preference before storing credentials
      if (data.rememberMe) {
        setRememberMe(true);
        setRememberMeState(true);
      }

      const result = await signInApi.mutateAsync(data);

      setAuthToken(result.token);
      setStoredUserId(result.userId);
      setStoredUserIdState(result.userId);
      setHasStoredSession(true);

      storeCredentials({
        userId: result.userId,
        password: result.password,
        salt: result.salt,
        encryptedMasterKey: result.encryptedMasterKey,
      });

      return { success: true };
    },
  };

  const logout = () => {
    clearCredentials();
    clearAuthToken();
    clearStoredUserId();
    setRememberMe(false);
    setRememberMeState(false);
    setHasStoredSession(false);
    setStoredUserIdState(null);
  };

  const clearSession = () => {
    clearAuthToken();
    clearStoredUserId();
    setRememberMe(false);
    setRememberMeState(false);
    setHasStoredSession(false);
    setStoredUserIdState(null);
  };

  return {
    signUp,
    signIn,
    logout,
    clearSession,
    hasStoredSession,
    storedUserId,
    rememberMe,
  };
}
