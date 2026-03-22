import { useQuery } from "@tanstack/react-query";
import {
  getClubNetwork,
  getEventNetwork,
  getMemberNetwork,
} from "../api/services/reportService";

export function useClubNetwork(clubId: number) {
  return useQuery({
    queryKey: ["report", "club-network", clubId],
    queryFn: () => getClubNetwork(clubId),
    enabled: clubId > 0,
  });
}

export function useEventNetwork(eventId: number) {
  return useQuery({
    queryKey: ["report", "event-network", eventId],
    queryFn: () => getEventNetwork(eventId),
    enabled: eventId > 0,
  });
}

export function useMemberNetwork(memberId: number) {
  return useQuery({
    queryKey: ["report", "member-network", memberId],
    queryFn: () => getMemberNetwork(memberId),
    enabled: memberId > 0,
  });
}
