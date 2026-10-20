import axios from "axios";

export const TOKEN_KEY = "ampshare_token";
export const PROFILE_KEY = "ampshare_profile";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new Event("auth:logout")); // AuthProvider clears the session
    }
    return Promise.reject(error);
  },
);