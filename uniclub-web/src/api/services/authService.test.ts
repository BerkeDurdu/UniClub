import { describe, it, expect, vi, beforeEach } from "vitest";
import * as service from "./authService";
import { apiClient } from "../client";

vi.mock("../client", () => {
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("authService", () => {
  it("getCurrentUser returns null when nothing stored", () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  it("isAuthenticated false without token", () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it("login resolves to ok kind on token response", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        access_token: "abc",
        token_type: "bearer",
        user: {
          id: 1, email: "x@y.com", full_name: "X", role: "member",
          club_id: null, is_active: true, created_at: "2024-01-01",
        },
      },
    });
    const result = await service.login({ email: "x@y.com", password: "Password#1" });
    expect(result.kind).toBe("ok");
    expect(window.localStorage.getItem("token")).toBe("abc");
  });

  it("login resolves to challenge kind", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { kind: "challenge", challenge_token: "ch", methods: ["totp"] },
    });
    const result = await service.login({ email: "x@y.com", password: "Password#1" });
    expect(result.kind).toBe("challenge");
    if (result.kind === "challenge") {
      expect(result.challengeToken).toBe("ch");
      expect(result.methods).toEqual(["totp"]);
    }
  });

  it("login throws Error on rejection", async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error("nope"));
    await expect(service.login({ email: "x@y.com", password: "Password#1" })).rejects.toThrow();
  });

  it("logout clears storage", () => {
    window.localStorage.setItem("token", "x");
    window.localStorage.setItem("uniclub.auth", "{}");
    service.logout();
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("uniclub.auth")).toBeNull();
  });

  it("setSessionToken stores the token", () => {
    service.setSessionToken("mytoken");
    expect(window.localStorage.getItem("token")).toBe("mytoken");
  });

  it("fetchCurrentUser returns mapped user", async () => {
    window.localStorage.setItem("token", "t");
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        id: 5, email: "a@b.com", full_name: "A B", role: "advisor",
        club_id: 2, is_active: true, created_at: "2024-01-01",
      },
    });
    const user = await service.fetchCurrentUser();
    expect(user.role).toBe("advisor");
    expect(user.clubId).toBe(2);
  });

  it("fetchAuthMeContext maps permissions", async () => {
    window.localStorage.setItem("token", "t");
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        id: 1, email: "m@x.com", full_name: "M", role: "member",
        club_id: 1, is_active: true, created_at: "2024-01-01",
        profile: { id: 7 },
        permissions: ["messages.send"],
      },
    });
    const ctx = await service.fetchAuthMeContext();
    expect(ctx.user.permissions).toEqual(["messages.send"]);
    expect(ctx.memberProfileId).toBe(7);
  });

  it("finalizeTokenLogin stores token and resolves user", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        id: 9, email: "o@x.com", full_name: "O", role: "member",
        club_id: null, is_active: true, created_at: "2024-01-01",
        permissions: [],
      },
    });
    const u = await service.finalizeTokenLogin("oauthtoken");
    expect(u.email).toBe("o@x.com");
    expect(window.localStorage.getItem("token")).toBe("oauthtoken");
  });

  it("register sends manual club fields when provided", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        access_token: "t", token_type: "bearer",
        user: {
          id: 1, email: "n@x.com", full_name: "N", role: "advisor",
          club_id: 9, is_active: true, created_at: "2024-01-01",
        },
      },
    });
    await service.register({
      fullName: "N", email: "n@x.com", password: "Password#1", role: "advisor",
      clubInputMode: "manual",
      manualClubName: "MC", manualClubCategory: "Cat", manualClubDescription: "D",
      manualClubFoundedDate: "2024-01-01",
    });
    const body = (apiClient.post as any).mock.calls[0][1];
    expect(body.club_input_mode).toBe("manual");
    expect(body.manual_club_name).toBe("MC");
    expect(body.manual_club_category).toBe("Cat");
    expect(body.manual_club_description).toBe("D");
    expect(body.manual_club_founded_date).toBe("2024-01-01");
  });

  it("register sends club_id when provided", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        access_token: "t", token_type: "bearer",
        user: {
          id: 1, email: "n@x.com", full_name: "N", role: "advisor",
          club_id: 5, is_active: true, created_at: "2024-01-01",
        },
      },
    });
    await service.register({
      fullName: "N", email: "n@x.com", password: "Password#1", role: "advisor", clubId: 5,
    });
    const body = (apiClient.post as any).mock.calls[0][1];
    expect(body.club_id).toBe(5);
  });

  it("register throws on rejection", async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error("boom"));
    await expect(service.register({
      fullName: "N", email: "n@x.com", password: "Password#1", role: "member",
    })).rejects.toThrow();
  });

  it("fetchCurrentUser logs out on rejection", async () => {
    window.localStorage.setItem("token", "t");
    (apiClient.get as any).mockRejectedValueOnce(new Error("nope"));
    await expect(service.fetchCurrentUser()).rejects.toThrow();
    expect(window.localStorage.getItem("token")).toBeNull();
  });

  it("fetchAuthMeContext logs out on rejection", async () => {
    window.localStorage.setItem("token", "t");
    (apiClient.get as any).mockRejectedValueOnce(new Error("nope"));
    await expect(service.fetchAuthMeContext()).rejects.toThrow();
    expect(window.localStorage.getItem("token")).toBeNull();
  });

  it("getCurrentUser returns null when stored value is malformed JSON", () => {
    window.localStorage.setItem("uniclub.auth", "{not json");
    expect(service.getCurrentUser()).toBeNull();
  });

  it("getCurrentUser returns null when fields missing", () => {
    window.localStorage.setItem("uniclub.auth", JSON.stringify({ id: 1 }));
    expect(service.getCurrentUser()).toBeNull();
  });

  it("getCurrentUser returns user when valid", () => {
    window.localStorage.setItem("uniclub.auth", JSON.stringify({
      email: "x@y.com", fullName: "X", role: "member",
    }));
    expect(service.getCurrentUser()).not.toBeNull();
  });

  it("isAuthenticated true when token + user", () => {
    window.localStorage.setItem("token", "abc");
    window.localStorage.setItem("uniclub.auth", JSON.stringify({
      email: "x@y.com", fullName: "X", role: "member",
    }));
    expect(service.isAuthenticated()).toBe(true);
  });

  it("register success persists session", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        access_token: "t", token_type: "bearer",
        user: {
          id: 1, email: "n@x.com", full_name: "N", role: "member",
          club_id: null, is_active: true, created_at: "2024-01-01",
        },
      },
    });
    const u = await service.register({
      fullName: "N", email: "n@x.com", password: "Password#1", role: "member",
    });
    expect(u.email).toBe("n@x.com");
    expect(window.localStorage.getItem("token")).toBe("t");
  });
});
