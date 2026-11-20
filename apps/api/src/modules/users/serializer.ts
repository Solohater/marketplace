import type { PublicUser } from "@marketplace/shared";
import type { User } from "../../db/schema.js";

export type { PublicUser };

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerifiedAt !== null,
    phoneVerified: user.phoneVerifiedAt !== null,
    createdAt: user.createdAt.toISOString(),
  };
}
