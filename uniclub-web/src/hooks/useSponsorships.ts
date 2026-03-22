import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAllSponsorships,
  getSponsorshipsByEvent,
  createSponsorship,
} from "../api/services/sponsorshipService";
import type { SponsorshipCreatePayload } from "../types";

export function useSponsorships() {
  return useQuery({
    queryKey: ["sponsorships"],
    queryFn: getAllSponsorships,
  });
}

export function useSponsorshipsByEvent(eventId: number) {
  return useQuery({
    queryKey: ["sponsorships", "event", eventId],
    queryFn: () => getSponsorshipsByEvent(eventId),
    enabled: eventId > 0,
  });
}

export function useCreateSponsorship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SponsorshipCreatePayload) => createSponsorship(payload),
    onSuccess: async () => {
      toast.success("Sponsorship created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
    },
  });
}
