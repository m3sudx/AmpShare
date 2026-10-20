import React, { useCallback, useEffect, useState } from "react";
import { TOKEN_KEY, PROFILE_KEY } from "../services/api";
import { getMeRequest, loginRequest, registerRequest } from "../services/auth.api";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";
import { AuthContext, type AuthContextType } from "./authContextBase";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  // Restore session from token on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
          setUser(null);
        }
        return;
      }

      try {
        const currentUser = await getMeRequest();
        if (isMounted) {
          setUser(currentUser);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
        }
      } catch {
        // If token is expired or invalid, clear sensitive auth state
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for automatic logout events triggered by API interceptor on 401
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [logout]);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const data = await loginRequest(payload);
    // Sensitive handling: never log or expose raw tokens
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const data = await registerRequest(payload);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
