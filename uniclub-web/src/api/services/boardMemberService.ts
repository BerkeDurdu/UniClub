import { apiClient } from "../client";
import type { BoardMember } from "../../types";

export async function getBoardMembers(): Promise<BoardMember[]> {
  const response = await apiClient.get<BoardMember[]>("/board-members");
  return response.data;
}
