import { UserRole } from "@prisma/client";

export function isAdmin(role?: UserRole): boolean {
  return role === "ADMIN";
}

