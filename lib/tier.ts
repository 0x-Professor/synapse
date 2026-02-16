import { Tier } from "@prisma/client";

export function canCreateSkill(tier: Tier, skillsCreated: number): boolean {
  if (tier === "TRIAL") {
    return skillsCreated < 3;
  }
  return true;
}

