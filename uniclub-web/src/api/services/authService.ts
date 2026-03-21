// TODO: Replace this mock implementation with backend auth endpoints when available.

const AUTH_KEY = "uniclub.auth";
const USERS_KEY = "uniclub.auth.users";

interface StoredUser {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  fullName: string;
  email: string;
}

function readUsers(): StoredUser[] {
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user: AuthUser): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.email || !user?.fullName) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const users = readUsers();
  const normalizedEmail = payload.email.toLowerCase().trim();
  const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);

  if (exists) {
    throw new Error("An account with this email already exists.");
  }

  const newUser: StoredUser = {
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    password: payload.password,
  };

  users.push(newUser);
  writeUsers(users);
  setSession({ fullName: newUser.fullName, email: newUser.email });

  return { fullName: newUser.fullName, email: newUser.email };
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const users = readUsers();
  const normalizedEmail = payload.email.toLowerCase().trim();
  const matched = users.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (!matched || matched.password !== payload.password) {
    throw new Error("Invalid email or password.");
  }

  const authUser = { fullName: matched.fullName, email: matched.email };
  setSession(authUser);
  return authUser;
}

export function logout(): void {
  window.localStorage.removeItem(AUTH_KEY);
}
