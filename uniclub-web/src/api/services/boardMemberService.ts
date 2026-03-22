import { apiClient } from "../client";
import type { BoardMember, BoardMemberCreatePayload } from "../../types";

export async function getBoardMembers(): Promise<BoardMember[]> {
  const response = await apiClient.get<BoardMember[]>("/board-members");
  return response.data;
}

export async function getBoardMemberById(id: number): Promise<BoardMember> {
  const response = await apiClient.get<BoardMember>(`/board-members/${id}`);
  return response.data;
}

export async function createBoardMember(payload: BoardMemberCreatePayload): Promise<BoardMember> {
  const response = await apiClient.post<BoardMember>("/board-members", payload);
  return response.data;
}
