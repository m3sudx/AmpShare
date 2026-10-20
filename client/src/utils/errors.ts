import { isAxiosError } from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (!error.response) return "Can't reach the server. Check your connection.";
  }
  return fallback;
}