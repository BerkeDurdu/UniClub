import { apiClient } from "../client";
import type { Registration } from "../../types";

export interface RegistrationPayload {
  event_id: number;
  member_id: number;
}

export async function getRegistrations(eventId?: number, memberId?: number): Promise<Registration[]> {
  const params: Record<string, number> = {};
  if (eventId !== undefined) params.event_id = eventId;
  if (memberId !== undefined) params.member_id = memberId;
  const response = await apiClient.get<Registration[]>("/registrations", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return response.data;
}

export async function registerForEvent(
  payload: RegistrationPayload
): Promise<Registration> {
  const response = await apiClient.post<Registration>("/registrations", payload);
  return response.data;
}
