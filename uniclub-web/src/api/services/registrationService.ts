import { apiClient } from "../client";
import type { Registration } from "../../types";

export interface RegistrationPayload {
  event_id: number;
  member_id: number;
}

export async function getRegistrations(eventId?: number): Promise<Registration[]> {
  const response = await apiClient.get<Registration[]>("/registrations", {
    params: eventId ? { event_id: eventId } : undefined,
  });
  return response.data;
}

export async function registerForEvent(
  payload: RegistrationPayload
): Promise<Registration> {
  const response = await apiClient.post<Registration>("/registrations", payload);
  return response.data;
}
