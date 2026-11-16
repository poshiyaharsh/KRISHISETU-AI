import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthTokenGetter } from '@/lib/api';
import {
  claimHistoryApi,
  deleteAccountApi,
  getMeApi,
  googleAuthApi,
  logoutApi,
  logoutEverywhereApi,
  refreshTokenApi,
  requestCodeApi,
  updateProfileApi,
  verifyCodeApi,
  type RequestCodeResponse,
} from './api';
import type { AuthTokens, FarmerProfile, User } from './types';

const GUEST_PREDICTIONS_KEY = 'krishisetu_guest_predictions';

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCode: (email: string, language?: string) => Promise<RequestCodeResponse>;
  verifyCode: (email: string, code: string, language?: string) => Promise<void>;
  loginWithGoogle: (credential: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: Partial<FarmerProfile>) => Promise<FarmerProfile>;
  refreshMe: () => Promise<void>;
  claimLocalPredictions: () => Promise<number>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-memory access token storage (never saved to localStorage or sessionStorage)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize API client token getter with in-memory token
  useEffect(() => {
    setAuthTokenGetter(() => accessToken);
  }, [accessToken]);

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
    if (!accessToken) {
      setUser(null);
      return;
    }
    try {
      const me = await getMeApi();
      setUser(me);
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }, [accessToken]);

  // Initial silent session check via httpOnly cookie on mount
  useEffect(() => {
    let isMounted = true;
    const initializeSession = async () => {
      try {
        const data = await refreshTokenApi();
        if (isMounted && data.access_token) {
          setAccessToken(data.access_token);
          setAuthTokenGetter(() => data.access_token);
          const me = await getMeApi();
          if (isMounted) {
            setUser(me);
          }
        }
      } catch {
        // Unauthenticated guest mode
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const requestCode = async (email: string, language = 'en'): Promise<RequestCodeResponse> => {
    return requestCodeApi(email, language);
  };

  const verifyCode = async (email: string, code: string, language = 'en') => {
    const data = await verifyCodeApi(email, code, language, 'web');
    setAccessToken(data.access_token);
    setUser(data.user);
    claimLocalPredictions();
  };

  const loginWithGoogle = async (credential: string, language = 'en') => {
    const data = await googleAuthApi(credential, 'web', language);
    setAccessToken(data.access_token);
    setUser(data.user);
    claimLocalPredictions();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Silently proceed with local teardown
    }
    setAccessToken(null);
    setUser(null);
  };

  const logoutEverywhere = async () => {
    try {
      await logoutEverywhereApi();
    } catch {
      // Silently proceed with local teardown
    }
    setAccessToken(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    await deleteAccountApi();
    setAccessToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<FarmerProfile>): Promise<FarmerProfile> => {
    const updated = await updateProfileApi(data);
    if (user) {
      setUser({ ...user, profile: updated });
    }
    return updated;
  };

  const tokens: AuthTokens | null = accessToken
    ? { access_token: accessToken }
    : null;

  const value: AuthContextValue = {
    user,
    tokens,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    requestCode,
    verifyCode,
    loginWithGoogle,
    logout,
    logoutEverywhere,
    deleteAccount,
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
  requestCode: async () => ({ status: 'ok', message: '' }),
  verifyCode: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  logoutEverywhere: async () => {},
  deleteAccount: async () => {},
  updateProfile: async () => ({} as FarmerProfile),
  refreshMe: async () => {},
  claimLocalPredictions: async () => 0,
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  return context || defaultAuthContextValue;
};
