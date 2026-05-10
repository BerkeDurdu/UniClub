import { describe, it, expect, vi, beforeEach } from "vitest";
import * as svc from "./oauthService";
import { apiClient } from "../client";

vi.mock("../client", () => ({ apiClient: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe("oauthService", () => {
  it("listProviders unwraps providers field", async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { providers: ["google", "github"] } });
    expect(await svc.listProviders()).toEqual(["google", "github"]);
  });

  it("loginUrl uses base url", () => {
    const url = svc.loginUrl("google");
    expect(url).toMatch(/\/auth\/oauth\/google\/login$/);
  });
});
