import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getVenues,
  getVenueById,
  createVenue,
} from "../api/services/venueService";
import type { VenueCreatePayload } from "../types";

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: getVenues,
  });
}

export function useVenue(id: number) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: () => getVenueById(id),
    enabled: id > 0,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VenueCreatePayload) => createVenue(payload),
    onSuccess: async () => {
      toast.success("Venue created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
