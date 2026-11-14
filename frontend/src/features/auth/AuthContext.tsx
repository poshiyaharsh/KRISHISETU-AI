import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthTokenGetter } from '@/lib/api';
import {
  claimHistoryApi,
  getMeApi,
  logoutApi,
  requestCodeApi,
  updateProfileApi,
  verifyCodeApi,
} from './api';
import type { AuthTokens, FarmerProfile, User } from './types';

const TOKEN_STORAGE_KEY = 'krishisetu_auth_tokens';
const GUEST_PREDICTIONS_KEY = 'krishisetu_guest_predictions';

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCode: (email: string, language?: string) => Promise<void>;
  verifyCode: (email: string, code: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<FarmerProfile>) => Promise<FarmerProfile>;
  refreshMe: () => Promise<void>;
  claimLocalPredictions: () => Promise<number>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize api client token getter
  useEffect(() => {
    if (tokens?.access_token) {
      setAuthTokenGetter(() => tokens.access_token);
    } else {
      setAuthTokenGetter(() => null);
    }
  }, [tokens]);

  const claimLocalPredictions = useCallback(async (): Promise<number> => {
    try {
      const raw = localStorage.getItem(GUEST_PREDICTIONS_KEY);
      if (!raw) return 0;
      const ids: number[] = JSON.parse(raw);
      if (!Array.isArray(ids) || ids.length === 0) return 0;

      const resp = await claimHistoryApi(ids);
      localStorage.removeItem(GUEST_PREDICTIONS_KEY);
      return resp.claimed_count;
    } catch {
      return 0;
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!tokens?.access_token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await getMeApi();
      setUser(me);
    } catch {
      // Access token might be expired or invalid
      setTokens(null);
      setUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const requestCode = async (email: string, language = 'en') => {
    await requestCodeApi(email, language);
  };

  const verifyCode = async (email: string, code: string, language = 'en') => {
    const data = await verifyCodeApi(email, code, language);
    const newTokens: AuthTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
    setTokens(newTokens);
    setUser(data.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));

    // Automatically claim predictions saved before login
    claimLocalPredictions();
  };

  const logout = async () => {
    if (tokens?.refresh_token) {
      try {
        await logoutApi(tokens.refresh_token);
      } catch {
        // Silently proceed with local teardown
      }
    }
    setTokens(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const updateProfile = async (data: Partial<FarmerProfile>): Promise<FarmerProfile> => {
    const updated = await updateProfileApi(data);
    if (user) {
      setUser({ ...user, profile: updated });
    }
    return updated;
  };

  const value: AuthContextValue = {
    user,
    tokens,
    isAuthenticated: Boolean(user && tokens),
    isLoading,
    requestCode,
    verifyCode,
    logout,
    updateProfile,
    refreshMe,
    claimLocalPredictions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const defaultAuthContextValue: AuthContextValue = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  requestCode: async () => {},
  verifyCode: async () => {},
  logout: async () => {},
  updateProfile: async () => ({} as FarmerProfile),
  refreshMe: async () => {},
  claimLocalPredictions: async () => 0,
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  return context || defaultAuthContextValue;
};
