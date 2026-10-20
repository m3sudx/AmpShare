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

// Attach Authorization Bearer token to all protected API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Clear session if 401 Unauthorized is returned
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  },
);