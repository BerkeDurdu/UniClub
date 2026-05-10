import { describe, expect, it } from "vitest";
import {
  canPerformAction,
  canViewSection,
  canManageClubResource,
  hasPermission,
  isAdmin,
  isMember,
  isSameClub,
  isStaffRole,
} from "./permissions";

describe("permissions helpers", () => {
  it("isMember", () => {
    expect(isMember("member")).toBe(true);
    expect(isMember("advisor")).toBe(false);
    expect(isMember(null)).toBe(false);
  });

  it("isAdmin", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("member")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("isStaffRole includes admin", () => {
    expect(isStaffRole("advisor")).toBe(true);
    expect(isStaffRole("board_member")).toBe(true);
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("member")).toBe(false);
  });

  it("canViewSection", () => {
    expect(canViewSection("advisor", "budgets")).toBe(true);
    expect(canViewSection("member", "budgets")).toBe(false);
    expect(canViewSection(null, "budgets")).toBe(false);
  });

  it("canPerformAction", () => {
    expect(canPerformAction("member", "self_register_event")).toBe(true);
    expect(canPerformAction("member", "delete_event")).toBe(false);
    expect(canPerformAction(null, "create_event")).toBe(false);
  });

  it("isSameClub", () => {
    expect(isSameClub(1, 1)).toBe(true);
    expect(isSameClub(1, 2)).toBe(false);
    expect(isSameClub(null, 1)).toBe(false);
    expect(isSameClub(1, null)).toBe(false);
  });

  it("canManageClubResource", () => {
    expect(canManageClubResource("advisor", 1, 1)).toBe(true);
    expect(canManageClubResource("advisor", 1, 2)).toBe(false);
    expect(canManageClubResource("member", 1, 1)).toBe(false);
  });

  it("hasPermission", () => {
    expect(hasPermission(["events.create"], "events.create")).toBe(true);
    expect(hasPermission(["events.create"], "events.delete")).toBe(false);
    expect(hasPermission(["*"], "anything")).toBe(true);
    expect(hasPermission(null, "x")).toBe(false);
    expect(hasPermission([], "x")).toBe(false);
  });
});
