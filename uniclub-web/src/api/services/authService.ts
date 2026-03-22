import { apiClient } from "../client";
import { getErrorMessage } from "../errors";
import type { AuthUser, UserRole } from "../../types";

const AUTH_KEY = "uniclub.auth";

interface BackendAuthUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  club_id: number | null;
  is_active: boolean;
  created_at: string;
}

interface BackendAuthMeResponse extends BackendAuthUser {
  profile?: {
    id?: number;
  } | null;
}

interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: BackendAuthUser;
}

interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  club_id?: number;
  club_input_mode?: "existing" | "manual";
  manual_club_name?: string;
  manual_club_category?: string;
  manual_club_description?: string;
  manual_club_founded_date?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  clubId?: number;
  clubInputMode?: "existing" | "manual";
  manualClubName?: string;
  manualClubCategory?: string;
  manualClubDescription?: string;
  manualClubFoundedDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  communicationChannel?: string;
  socialLink?: string;
  sponsorContactName?: string;
  sponsorContactRole?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthMeContext {
  user: AuthUser;
  memberProfileId: number | null;
}

function mapBackendUser(user: BackendAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    clubId: user.club_id,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function setSession(user: AuthUser, token: string): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.localStorage.setItem("token", token);
}

export function getCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.email || !user?.fullName || !user?.role) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(window.localStorage.getItem("token") && getCurrentUser());
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const requestBody: RegisterRequest = {
    full_name: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    role: payload.role,
  };

  if (typeof payload.clubId === "number") {
    requestBody.club_id = payload.clubId;
  }

  if (payload.clubInputMode) {
    requestBody.club_input_mode = payload.clubInputMode;
  }
  if (payload.manualClubName) {
    requestBody.manual_club_name = payload.manualClubName;
  }
  if (payload.manualClubCategory) {
    requestBody.manual_club_category = payload.manualClubCategory;
  }
  if (payload.manualClubDescription) {
    requestBody.manual_club_description = payload.manualClubDescription;
  }
  if (payload.manualClubFoundedDate) {
    requestBody.manual_club_founded_date = payload.manualClubFoundedDate;
  }

  try {
    const response = await apiClient.post<TokenResponse>("/auth/register", requestBody);
    const authUser = mapBackendUser(response.data.user);
    setSession(authUser, response.data.access_token);
    return authUser;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  try {
    const response = await apiClient.post<TokenResponse>("/auth/login", {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });
    const authUser = mapBackendUser(response.data.user);
    setSession(authUser, response.data.access_token);
    return authUser;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const response = await apiClient.get<BackendAuthUser>("/auth/me");
    const authUser = mapBackendUser(response.data);
    const token = window.localStorage.getItem("token");
    if (token) {
      setSession(authUser, token);
    }
    return authUser;
  } catch (error) {
    logout();
    throw new Error(getErrorMessage(error));
  }
}

export async function fetchAuthMeContext(): Promise<AuthMeContext> {
  try {
    const response = await apiClient.get<BackendAuthMeResponse>("/auth/me");
    const authUser = mapBackendUser(response.data);
    const token = window.localStorage.getItem("token");
    if (token) {
      setSession(authUser, token);
    }

    const memberProfileId =
      authUser.role === "member" && typeof response.data.profile?.id === "number"
        ? response.data.profile.id
        : null;

    return {
      user: authUser,
      memberProfileId,
    };
  } catch (error) {
    logout();
    throw new Error(getErrorMessage(error));
  }
}

export function logout(): void {
  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem("token");
}
