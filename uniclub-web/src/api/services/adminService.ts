import { apiClient } from "../client";
import type { UserRole } from "../../types";

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  club_id: number | null;
  is_active: boolean;
}

export interface PermissionRow {
  id: number;
  code: string;
  description: string;
}

export type PermissionMatrix = Record<string, string[]>;

export async function listPermissions(): Promise<PermissionRow[]> {
  const r = await apiClient.get<PermissionRow[]>("/admin/permissions");
  return r.data;
}

export async function getMatrix(): Promise<PermissionMatrix> {
  const r = await apiClient.get<PermissionMatrix>("/admin/role-permissions");
  return r.data;
}

export async function setMatrix(matrix: PermissionMatrix): Promise<PermissionMatrix> {
  const r = await apiClient.put<PermissionMatrix>("/admin/role-permissions", { matrix });
  return r.data;
}

export async function listUsers(): Promise<AdminUser[]> {
  const r = await apiClient.get<AdminUser[]>("/admin/users");
  return r.data;
}

export async function changeUserRole(id: number, role: UserRole, club_id?: number | null): Promise<AdminUser> {
  const r = await apiClient.put<AdminUser>(`/admin/users/${id}/role`, { role, club_id: club_id ?? null });
  return r.data;
}

export async function setUserActive(id: number, is_active: boolean): Promise<AdminUser> {
  const r = await apiClient.put<AdminUser>(`/admin/users/${id}/active`, { is_active });
  return r.data;
}
