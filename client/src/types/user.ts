export type Role = "DRIVER" | "HOST";

export interface AuthUser {
  id: string;
  roles: Role[];
  fullName?: string;
  phoneNumber?: string;
}