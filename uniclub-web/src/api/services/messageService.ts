import { apiClient } from "../client";
import type { Message, MessageCreatePayload, MessageRecipientOption } from "../../types";

export async function getMessagesByClub(clubId: number): Promise<Message[]> {
  const response = await apiClient.get<Message[]>(`/clubs/${clubId}/messages`);
  return response.data;
}

export async function getAllMessages(): Promise<Message[]> {
  const response = await apiClient.get<Message[]>("/messages");
  return response.data;
}

export async function createMessage(payload: MessageCreatePayload): Promise<Message> {
  const response = await apiClient.post<Message>("/messages", payload);
  return response.data;
}

export async function getMessageRecipientOptions(): Promise<MessageRecipientOption[]> {
  const response = await apiClient.get<MessageRecipientOption[]>("/messages/recipient-options");
  return response.data;
}
