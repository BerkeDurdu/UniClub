import { apiClient } from "../client";
import type { Sponsorship } from "../../types";

export async function getSponsorshipsByEvent(
  eventId: number
): Promise<Sponsorship[]> {
  const response = await apiClient.get<Sponsorship[]>(`/events/${eventId}/sponsorships`);
  return response.data;
}
