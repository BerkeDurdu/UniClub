import { apiClient } from "../client";

export interface TwoFactorStatus {
  totp: boolean;
  email: boolean;
  webauthn: boolean;
  webauthn_credentials: Array<{ id: number; label: string; created_at: string }>;
}

export interface TOTPSetup {
  secret: string;
  otpauth_url: string;
  qr_png_base64: string;
}

export async function getStatus(): Promise<TwoFactorStatus> {
  const r = await apiClient.get<TwoFactorStatus>("/2fa/status");
  return r.data;
}

export async function setupTotp(): Promise<TOTPSetup> {
  const r = await apiClient.post<TOTPSetup>("/2fa/totp/setup");
  return r.data;
}

export async function confirmTotp(code: string): Promise<void> {
  await apiClient.post("/2fa/totp/confirm", { code });
}

export async function disableTotp(): Promise<void> {
  await apiClient.delete("/2fa/totp");
}

export async function enableEmail(): Promise<void> {
  await apiClient.post("/2fa/email/enable");
}

export async function disableEmail(): Promise<void> {
  await apiClient.delete("/2fa/email");
}

// 2FA login flow
export async function loginVerifyTotp(challenge_token: string, code: string): Promise<string> {
  const r = await apiClient.post<{ access_token: string }>("/2fa/login/totp", { challenge_token, code });
  return r.data.access_token;
}

export async function loginEmailSend(challenge_token: string): Promise<void> {
  await apiClient.post("/2fa/login/email/send", { challenge_token });
}

export async function loginVerifyEmail(challenge_token: string, code: string): Promise<string> {
  const r = await apiClient.post<{ access_token: string }>("/2fa/login/email/verify", { challenge_token, code });
  return r.data.access_token;
}

// WebAuthn registration helpers
export interface WebAuthnRegisterOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: "public-key"; alg: number }>;
  authenticatorSelection: { userVerification?: string };
  timeout: number;
}

export async function webauthnRegisterStart(): Promise<WebAuthnRegisterOptions> {
  const r = await apiClient.post<WebAuthnRegisterOptions>("/2fa/webauthn/register/start");
  return r.data;
}

export async function webauthnRegisterVerify(payload: {
  challenge: string;
  credential_id: string;
  public_key: string;
  label?: string;
}): Promise<void> {
  await apiClient.post("/2fa/webauthn/register/verify", payload);
}

export async function webauthnDelete(id: number): Promise<void> {
  await apiClient.delete(`/2fa/webauthn/${id}`);
}

// WebAuthn login
export async function webauthnLoginStart(challenge_token: string): Promise<{
  challenge: string;
  rpId: string;
  allowCredentials: Array<{ type: "public-key"; id: string }>;
  timeout: number;
  userVerification: string;
}> {
  const r = await apiClient.post("/2fa/login/webauthn/start", { challenge_token });
  return r.data as {
    challenge: string;
    rpId: string;
    allowCredentials: Array<{ type: "public-key"; id: string }>;
    timeout: number;
    userVerification: string;
  };
}

export async function webauthnLoginVerify(
  challenge_token: string,
  challenge: string,
  credential_id: string,
): Promise<string> {
  const r = await apiClient.post<{ access_token: string }>("/2fa/login/webauthn/verify", {
    challenge_token,
    challenge,
    credential_id,
  });
  return r.data.access_token;
}
