import React, { useCallback, useEffect, useState } from "react";
import {
  TOKEN_KEY,
  PROFILE_KEY,
  getStoredToken,
  getStoredProfile,
} from "../services/api";
import {
  becomeHostRequest,
  getMeRequest,
  loginRequest,
  registerRequest,
} from "../services/auth.api";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";
import { AuthContext, type AuthContextType } from "./authContextBase";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedProfile = getStoredProfile();
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return getStoredToken();
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  // Restore session from token on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
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
          if (localStorage.getItem(TOKEN_KEY)) {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
          } else {
            sessionStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
          }
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

  const login = useCallback(
    async (payload: LoginPayload, rememberMe: boolean = true): Promise<User> => {
      const data = await loginRequest(payload);
      // If rememberMe is true, persist token across browser restarts in localStorage.
      // If rememberMe is false, store token in sessionStorage so closing the browser tab logs out.
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(PROFILE_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      const data = await registerRequest(payload);
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(PROFILE_KEY);
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    []
  );

  // Adds the HOST role. Roles live inside the JWT, so swap in the fresh token
  // first, then reload the profile with the new roles.
  const becomeHost = useCallback(async (): Promise<User> => {
    const data = await becomeHostRequest();
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
    } else {
      sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    }
    setAccessToken(data.accessToken);
    const currentUser = await getMeRequest();
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(currentUser));
    }
    setUser(currentUser);
    return currentUser;
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    login,
    register,
    logout,
    becomeHost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};