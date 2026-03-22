import { apiClient } from "../client";
import type { Member, MemberCreatePayload } from "../../types";

export interface MemberQueryParams {
  department?: string;
  club_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export async function getMembers(
  params: MemberQueryParams = {}
): Promise<Member[]> {
  const response = await apiClient.get<Member[]>("/members", { params });
  return response.data;
}

export async function getMemberById(id: number): Promise<Member> {
  const response = await apiClient.get<Member>(`/members/${id}`);
  return response.data;
}

export async function createMember(payload: MemberCreatePayload): Promise<Member> {
  const response = await apiClient.post<Member>("/members", payload);
  return response.data;
}
