import type { AuthUser, Role } from "../types/user";

export function decodeToken(token: string): AuthUser | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, roles: (payload.roles ?? []) as Role[] };
  } catch {
    return null;
  }
}