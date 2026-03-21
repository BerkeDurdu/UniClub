import { apiClient } from "../client";
import type { Message } from "../../types";

export async function getMessagesByClub(clubId: number): Promise<Message[]> {
  const response = await apiClient.get<Message[]>(`/clubs/${clubId}/messages`);
  return response.data;
}
