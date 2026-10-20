import { api } from "./api";
import type {
  ApiResponse,
  AuthResponseData,
  LoginPayload,
  MeResponseData,
  RegisterPayload,
  User,
} from "../types/auth";

/**
 * Signs in a driver using phone number and password.
 * POST /api/auth/login
 */
export async function loginRequest(
  payload: LoginPayload
): Promise<AuthResponseData> {
  const res = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/login",
    payload
  );
  return res.data.data;
}

/**
 * Registers a new driver account.
 * POST /api/auth/register
 */
export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthResponseData> {
  const res = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/register",
    payload
  );
  return res.data.data;
}

/**
 * Fetches the current authenticated user's profile and roles using saved token.
 * GET /api/auth/me
 */
export async function getMeRequest(): Promise<User> {
  const res = await api.get<ApiResponse<MeResponseData>>("/auth/me");
  return res.data.data.user;
}