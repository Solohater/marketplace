export const UserRole = {
  USER: "USER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
  DELIVERY_AGENT: "DELIVERY_AGENT",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES: readonly UserRoleValue[] = Object.values(UserRole);

export const UserStatus = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DISABLED: "DISABLED",
} as const;

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];

export const USER_STATUSES: readonly UserStatusValue[] = Object.values(UserStatus);
