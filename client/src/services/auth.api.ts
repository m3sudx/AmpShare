import { api } from "./api";

export interface LoginResult {
  accessToken: string;
  user?: { fullName?: string; phoneNumber?: string };
}

export async function loginRequest(phoneNumber: string, password: string): Promise<LoginResult> {
  const res = await api.post("/auth/login", { phoneNumber, password });
  return res.data.data; // adjust to your real response shape
}

export async function registerRequest(fullName: string, phoneNumber: string, password: string) {
  const res = await api.post("/auth/register", { fullName, phoneNumber, password });
  return res.data.data;
}