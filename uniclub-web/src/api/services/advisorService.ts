import { apiClient } from "../client";
import type { Advisor, AdvisorCreatePayload } from "../../types";

export async function getAdvisors(): Promise<Advisor[]> {
  const response = await apiClient.get<Advisor[]>("/advisors");
  return response.data;
}

export async function getAdvisorById(id: number): Promise<Advisor> {
  const response = await apiClient.get<Advisor>(`/advisors/${id}`);
  return response.data;
}

export async function createAdvisor(payload: AdvisorCreatePayload): Promise<Advisor> {
  const response = await apiClient.post<Advisor>("/advisors", payload);
  return response.data;
}
