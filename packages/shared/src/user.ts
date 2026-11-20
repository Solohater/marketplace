import type { UserRoleValue, UserStatusValue } from "./roles.js";

export interface PublicUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRoleValue;
  status: UserStatusValue;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}
