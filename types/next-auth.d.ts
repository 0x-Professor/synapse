import { Tier, UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tier: Tier;
      isBanned: boolean;
    } & DefaultSession["user"];
  }
}
