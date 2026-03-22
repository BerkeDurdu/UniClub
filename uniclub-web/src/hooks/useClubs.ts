import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getClubs,
  getClubById,
  createClub,
  deleteClub,
  type ClubQueryParams,
} from "../api/services/clubService";
import type { ClubCreatePayload } from "../types";

export function useClubs(params?: ClubQueryParams) {
  return useQuery({
    queryKey: ["clubs", params],
    queryFn: () => getClubs(params),
  });
}

export function useClub(id: number) {
  return useQuery({
    queryKey: ["club", id],
    queryFn: () => getClubById(id),
    enabled: id > 0,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClubCreatePayload) => createClub(payload),
    onSuccess: async () => {
      toast.success("Club created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteClub(id),
    onSuccess: async () => {
      toast.success("Club deleted.");
      await queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}
