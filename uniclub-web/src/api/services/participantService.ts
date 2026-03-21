import { apiClient } from "../client";
import type { Participant, ParticipantCreatePayload } from "../../types";

export async function getEventParticipants(
  eventId: number,
  linkedMemberOnly?: boolean
): Promise<Participant[]> {
  const response = await apiClient.get<Participant[]>(`/events/${eventId}/participants`, {
    params:
      linkedMemberOnly === undefined
        ? undefined
        : { linked_member_only: linkedMemberOnly },
  });
  return response.data;
}

export async function createParticipant(
  payload: ParticipantCreatePayload
): Promise<Participant> {
  const response = await apiClient.post<Participant>("/participants", payload);
  return response.data;
}
