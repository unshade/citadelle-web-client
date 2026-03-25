"use client";

/**
 * TanStack Query hooks for the auth endpoints.
 * Pure API layer — no UI state, no side effects beyond the request.
 */
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { generateEncryptedUserData, decryptAuthChallenge } from "@/lib/crypto";
import type { SignInFormData, SignUpFormData } from "@/lib/schemas";

type SignUpResult = {
  userId: string;
  password: string;
  salt: string;
  encryptedMasterKey: string;
};

/** Generates encrypted credentials client-side, then registers the user. */
export function useSignUpMutation() {
  return useMutation({
    mutationFn: async (data: SignUpFormData): Promise<SignUpResult> => {
      const encrypted = await generateEncryptedUserData(data.password);

      const response = await authApi.signUp({
        b64Salt: encrypted.b64Salt,
        b64EncryptedMasterKey: encrypted.b64EncryptedMasterKey,
        b64EncryptedChallenge: encrypted.b64EncryptedChallenge,
        clearChallenge: encrypted.clearChallenge,
      });

      return {
        userId: response.data.uuid,
        password: data.password,
        salt: encrypted.b64Salt,
        encryptedMasterKey: encrypted.b64EncryptedMasterKey,
      };
    },
  });
}

type SignInResult = {
  token: string;
  userId: string;
  password: string;
  salt: string;
  encryptedMasterKey: string;
};

/**
 * Challenge-response sign-in:
 * 1. Fetch user data (salt, encrypted master key)
 * 2. Fetch encrypted challenge
 * 3. Decrypt challenge client-side (proves we know the password)
 * 4. Send cleartext challenge back → server returns JWT
 */
export function useSignInMutation() {
  return useMutation({
    mutationFn: async (data: SignInFormData): Promise<SignInResult> => {
      const userResponse = await authApi.getUser(data.userId);
      const user = userResponse.data;

      const challengeResponse = await authApi.getChallenge(data.userId);

      const clearChallenge = await decryptAuthChallenge(
        data.password,
        user.Salt,
        user.EncryptedMasterKey,
        challengeResponse.data.b64EncryptedChallenge,
      );

      const verifyResponse = await authApi.verifyChallenge({
        userUuid: data.userId,
        clearChallenge,
      });

      return {
        token: verifyResponse.data.token,
        userId: data.userId,
        password: data.password,
        salt: user.Salt,
        encryptedMasterKey: user.EncryptedMasterKey,
      };
    },
  });
}
