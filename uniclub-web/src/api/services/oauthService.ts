import { apiClient } from "../client";

export type OAuthProvider = "google" | "github" | "microsoft" | "facebook";

export async function listProviders(): Promise<OAuthProvider[]> {
  const r = await apiClient.get<{ providers: OAuthProvider[] }>("/auth/oauth/providers");
  return r.data.providers;
}

export function loginUrl(provider: OAuthProvider): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
  return `${base.replace(/\/$/, "")}/auth/oauth/${provider}/login`;
}
