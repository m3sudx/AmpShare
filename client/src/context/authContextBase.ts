import { createContext } from "react";
import type { LoginPayload, RegisterPayload, User } from "../types/auth";

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  becomeHost: () => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);