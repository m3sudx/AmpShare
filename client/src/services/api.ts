import axios from "axios";

export const TOKEN_KEY = "ampshare_token";
export const PROFILE_KEY = "ampshare_profile";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3003/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredProfile(): string | null {
  return localStorage.getItem(PROFILE_KEY) || sessionStorage.getItem(PROFILE_KEY);
}

// Attach Authorization Bearer token to all protected API calls
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Clear session if 401 Unauthorized is returned
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (getStoredToken()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(PROFILE_KEY);
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Standardize error message extraction from API responses
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "Unexpected server error";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}