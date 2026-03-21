import { apiClient } from "../client";
import type { Venue } from "../../types";

export async function getVenues(): Promise<Venue[]> {
  const response = await apiClient.get<Venue[]>("/venues");
  return response.data;
}
