"use client";

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { 
  generateEncryptedUserData, 
  decryptAuthChallenge,
  storeCredentials,
  setAuthToken,
  getStoredCredentials,
  clearCredentials,
  clearAuthToken,
  setStoredUserId,
  getStoredUserId,
  clearStoredUserId,
  isAuthenticated,
} from '@/lib/crypto';

interface UseAuthReturn {
  signUp: (password: string) => Promise<{ success: boolean; userId?: string; error?: string }>;
  signIn: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  hasStoredSession: boolean;
  storedUserId: string | null;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [storedUserId, setStoredUserIdState] = useState<string | null>(null);

  // Check for stored session on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setHasStoredSession(true);
      setStoredUserIdState(getStoredUserId());
    }
  }, []);

  const clearError = () => setError(null);

  const signUp = async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate encrypted data client-side (challenge is auto-generated)
      const encryptedData = await generateEncryptedUserData(password);
      
      // Send to backend
      const response = await authApi.signUp({
        b64Salt: encryptedData.b64Salt,
        b64EncryptedMasterKey: encryptedData.b64EncryptedMasterKey,
        b64EncryptedChallenge: encryptedData.b64EncryptedChallenge,
        clearChallenge: encryptedData.clearChallenge,
      });
      
      const userId = response.data.uuid;
      
      // Store credentials in memory for future use
      storeCredentials({
        userId,
        password,
        salt: encryptedData.b64Salt,
        encryptedMasterKey: encryptedData.b64EncryptedMasterKey,
      });
      
      return { success: true, userId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userId: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get user data to retrieve salt and encrypted master key
      const userResponse = await authApi.getUser(userId);
      console.log('getUser response:', userResponse);
      const user = userResponse.data;
      
      // Step 2: Get encrypted challenge from auth endpoint
      const challengeResponse = await authApi.getChallenge(userId);
      console.log('getChallenge response:', challengeResponse);
      const encryptedChallenge = challengeResponse.data.b64EncryptedChallenge;
      
      console.log('User data:', {
        id: user?.Id,
        saltLength: user?.Salt?.length,
        encryptedMasterKeyLength: user?.EncryptedMasterKey?.length
      });
      
      // Step 3: Decrypt the challenge locally
      const clearChallenge = await decryptAuthChallenge(
        password,
        user.Salt,
        user.EncryptedMasterKey,
        encryptedChallenge
      );
      
      // Step 4: Verify challenge with backend
      const verifyResponse = await authApi.verifyChallenge({
        userUuid: userId,
        clearChallenge,
      });
      
      // Step 5: Store JWT token
      setAuthToken(verifyResponse.data.token);
      
      // Store user ID for session restoration
      setStoredUserId(userId);
      setStoredUserIdState(userId);
      setHasStoredSession(true);
      
      // Store credentials for session (in memory only)
      storeCredentials({
        userId,
        password,
        salt: user.Salt,
        encryptedMasterKey: user.EncryptedMasterKey,
      });
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearCredentials();
    clearAuthToken();
  };

  return {
    signUp,
    signIn,
    logout,
    isLoading,
    error,
    clearError,
    hasStoredSession,
    storedUserId,
  };
}
