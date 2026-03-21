import { apiClient } from "../client";
import type { Member } from "../../types";

export interface MemberQueryParams {
  department?: string;
  club_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface MemberCreatePayload {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  join_date: string;
  club_id?: number;
}

export async function getMembers(
  params: MemberQueryParams = {}
): Promise<Member[]> {
  const response = await apiClient.get<Member[]>("/members", { params });
  return response.data;
}

export async function createMember(payload: MemberCreatePayload): Promise<Member> {
  const response = await apiClient.post<Member>("/members", payload);
  return response.data;
}
