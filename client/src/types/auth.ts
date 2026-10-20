export type Role = "DRIVER" | "HOST" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  roles: Role[] | string[];
  phoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
}

export interface MeResponseData {
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoginPayload {
  phoneNumber: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  phoneNumber: string;
  password: string;
}
