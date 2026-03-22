import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getBoardMembers,
  getBoardMemberById,
  createBoardMember,
} from "../api/services/boardMemberService";
import type { BoardMemberCreatePayload } from "../types";

export function useBoardMembers() {
  return useQuery({
    queryKey: ["board-members"],
    queryFn: getBoardMembers,
  });
}

export function useBoardMember(id: number) {
  return useQuery({
    queryKey: ["board-member", id],
    queryFn: () => getBoardMemberById(id),
    enabled: id > 0,
  });
}

export function useCreateBoardMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BoardMemberCreatePayload) => createBoardMember(payload),
    onSuccess: async () => {
      toast.success("Board member created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["board-members"] });
    },
  });
}
