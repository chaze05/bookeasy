import type { UserRole } from "@/types";

const ROLE_RANK: Record<UserRole, number> = {
  superadmin: 4,
  owner: 3,
  staff: 2,
  customer: 1,
};

export function hasRole(
  userRole: UserRole | null | undefined,
  required: UserRole
): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function isSuperadmin(role: UserRole | null | undefined): boolean {
  return role === "superadmin";
}

export function isOwnerOrAbove(role: UserRole | null | undefined): boolean {
  return hasRole(role, "owner");
}

export function isStaffOrAbove(role: UserRole | null | undefined): boolean {
  return hasRole(role, "staff");
}
