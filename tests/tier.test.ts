import { describe, expect, it } from "vitest";
import { canCreateSkill } from "@/lib/tier";

describe("canCreateSkill", () => {
  it("blocks trial users after 3 skills", () => {
    expect(canCreateSkill("TRIAL", 2)).toBe(true);
    expect(canCreateSkill("TRIAL", 3)).toBe(false);
  });

  it("allows pro and enterprise users", () => {
    expect(canCreateSkill("PRO", 999)).toBe(true);
    expect(canCreateSkill("ENTERPRISE", 999)).toBe(true);
  });
});

