import { apiClient } from "../client";
import type {
  ClubNetworkReport,
  EventNetworkReport,
  MemberNetworkReport,
} from "../../types";

export async function getClubNetwork(clubId: number): Promise<ClubNetworkReport> {
  const response = await apiClient.get<ClubNetworkReport>(
    `/reports/club-network/${clubId}`
  );
  return response.data;
}

export async function getEventNetwork(eventId: number): Promise<EventNetworkReport> {
  const response = await apiClient.get<EventNetworkReport>(
    `/reports/event-network/${eventId}`
  );
  return response.data;
}

export async function getMemberNetwork(memberId: number): Promise<MemberNetworkReport> {
  const response = await apiClient.get<MemberNetworkReport>(
    `/reports/member-network/${memberId}`
  );
  return response.data;
}
