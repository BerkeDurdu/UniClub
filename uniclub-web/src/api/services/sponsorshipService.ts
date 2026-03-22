import { apiClient } from "../client";
import type { Sponsorship, SponsorshipCreatePayload } from "../../types";

export async function getSponsorshipsByEvent(
  eventId: number
): Promise<Sponsorship[]> {
  const response = await apiClient.get<Sponsorship[]>(`/events/${eventId}/sponsorships`);
  return response.data;
}

export async function getAllSponsorships(): Promise<Sponsorship[]> {
  const response = await apiClient.get<Sponsorship[]>("/sponsorships");
  return response.data;
}

export async function createSponsorship(payload: SponsorshipCreatePayload): Promise<Sponsorship> {
  const response = await apiClient.post<Sponsorship>("/sponsorships", payload);
  return response.data;
}
