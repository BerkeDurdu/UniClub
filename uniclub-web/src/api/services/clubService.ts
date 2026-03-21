import { apiClient } from "../client";
import type { Club, ClubCreatePayload } from "../../types";

export interface ClubQueryParams {
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export async function getClubs(params: ClubQueryParams = {}): Promise<Club[]> {
  const response = await apiClient.get<Club[]>("/clubs", { params });
  return response.data;
}

export async function getClubById(id: number): Promise<Club> {
  const response = await apiClient.get<Club>(`/clubs/${id}`);
  return response.data;
}

export async function createClub(payload: ClubCreatePayload): Promise<Club> {
  const response = await apiClient.post<Club>("/clubs", payload);
  return response.data;
}
