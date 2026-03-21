import { apiClient } from "../client";
import type { Advisor } from "../../types";

export async function getAdvisors(): Promise<Advisor[]> {
  const response = await apiClient.get<Advisor[]>("/advisors");
  return response.data;
}
