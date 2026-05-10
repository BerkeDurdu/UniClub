import { describe, it, expect, vi, beforeEach } from "vitest";
import * as svc from "./adminService";
import { apiClient } from "../client";

vi.mock("../client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("adminService", () => {
  it("listPermissions returns array", async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 1, code: "x", description: "d" }] });
    expect(await svc.listPermissions()).toHaveLength(1);
  });

  it("getMatrix returns dict", async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { member: ["a"] } });
    expect(await svc.getMatrix()).toEqual({ member: ["a"] });
  });

  it("setMatrix posts and returns", async () => {
    (apiClient.put as any).mockResolvedValueOnce({ data: { member: ["a"] } });
    const r = await svc.setMatrix({ member: ["a"] });
    expect(r.member).toContain("a");
    expect((apiClient.put as any).mock.calls[0][0]).toBe("/admin/role-permissions");
  });

  it("listUsers", async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    expect(await svc.listUsers()).toEqual([]);
  });

  it("changeUserRole", async () => {
    (apiClient.put as any).mockResolvedValueOnce({ data: { id: 1, role: "advisor" } });
    const r = await svc.changeUserRole(1, "advisor", 2);
    expect(r.role).toBe("advisor");
    expect((apiClient.put as any).mock.calls[0][1]).toEqual({ role: "advisor", club_id: 2 });
  });

  it("changeUserRole defaults club_id to null", async () => {
    (apiClient.put as any).mockResolvedValueOnce({ data: { id: 1, role: "admin" } });
    await svc.changeUserRole(1, "admin");
    expect((apiClient.put as any).mock.calls[0][1]).toEqual({ role: "admin", club_id: null });
  });

  it("setUserActive", async () => {
    (apiClient.put as any).mockResolvedValueOnce({ data: { id: 1, is_active: false } });
    const r = await svc.setUserActive(1, false);
    expect(r.is_active).toBe(false);
  });
});
