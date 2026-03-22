import { apiClient } from "../client";
import type { Venue, VenueCreatePayload } from "../../types";

export async function getVenues(): Promise<Venue[]> {
  const response = await apiClient.get<Venue[]>("/venues");
  return response.data;
}

export async function getVenueById(id: number): Promise<Venue> {
  const response = await apiClient.get<Venue>(`/venues/${id}`);
  return response.data;
}

export async function createVenue(payload: VenueCreatePayload): Promise<Venue> {
  const response = await apiClient.post<Venue>("/venues", payload);
  return response.data;
}
