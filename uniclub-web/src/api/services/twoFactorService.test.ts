import { describe, it, expect, vi, beforeEach } from "vitest";
import * as svc from "./twoFactorService";
import { apiClient } from "../client";

vi.mock("../client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("twoFactorService", () => {
  it("getStatus", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: { totp: false, email: false, webauthn: false, webauthn_credentials: [] },
    });
    const s = await svc.getStatus();
    expect(s.totp).toBe(false);
  });

  it("setupTotp", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { secret: "s", otpauth_url: "u", qr_png_base64: "x" },
    });
    expect((await svc.setupTotp()).secret).toBe("s");
  });

  it("confirmTotp", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: {} });
    await svc.confirmTotp("123456");
    expect((apiClient.post as any).mock.calls[0][1]).toEqual({ code: "123456" });
  });

  it("disableTotp", async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: {} });
    await svc.disableTotp();
  });

  it("enable/disable email", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: {} });
    (apiClient.delete as any).mockResolvedValueOnce({ data: {} });
    await svc.enableEmail();
    await svc.disableEmail();
  });

  it("loginVerifyTotp returns access_token", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { access_token: "t" } });
    expect(await svc.loginVerifyTotp("ch", "1")).toBe("t");
  });

  it("loginEmailSend", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: {} });
    await svc.loginEmailSend("ch");
  });

  it("loginVerifyEmail", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { access_token: "t" } });
    expect(await svc.loginVerifyEmail("ch", "123456")).toBe("t");
  });

  it("webauthnRegisterStart", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { challenge: "c", rp: { id: "x", name: "y" }, user: { id: "1", name: "n", displayName: "n" }, pubKeyCredParams: [], authenticatorSelection: {}, timeout: 1000 },
    });
    const r = await svc.webauthnRegisterStart();
    expect(r.challenge).toBe("c");
  });

  it("webauthnRegisterVerify", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: {} });
    await svc.webauthnRegisterVerify({
      challenge: "c", credential_id: "id", public_key: "pk",
    });
  });

  it("webauthnDelete", async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: {} });
    await svc.webauthnDelete(1);
  });

  it("webauthnLoginStart", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { challenge: "c", rpId: "r", allowCredentials: [], timeout: 1, userVerification: "preferred" },
    });
    const r = await svc.webauthnLoginStart("ch");
    expect(r.challenge).toBe("c");
  });

  it("webauthnLoginVerify", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { access_token: "t" } });
    expect(await svc.webauthnLoginVerify("ch", "c", "id")).toBe("t");
  });
});
