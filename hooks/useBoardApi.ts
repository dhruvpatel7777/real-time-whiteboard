import { useCallback } from "react";
import {
  BoardSummary,
  BoardDetail,
  CreateBoardInput,
  UpdateBoardInput,
  AddMemberInput,
  BoardMemberWithUser,
} from "@/types/board";

export function useBoardApi() {
  const getBoards = useCallback(async (): Promise<BoardSummary[]> => {
    const res = await fetch("/api/boards");
    if (!res.ok) {
      throw new Error("Failed to fetch boards");
    }
    return res.json();
  }, []);

  const createBoard = useCallback(
    async (input: CreateBoardInput): Promise<BoardSummary> => {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create board");
      }
      return res.json();
    },
    []
  );

  const getBoard = useCallback(
    async (boardId: string): Promise<BoardDetail> => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch board");
      }
      return res.json();
    },
    []
  );

  const updateBoard = useCallback(
    async (boardId: string, input: UpdateBoardInput): Promise<void> => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update board");
      }
    },
    []
  );

  const deleteBoard = useCallback(async (boardId: string): Promise<void> => {
    const res = await fetch(`/api/boards/${boardId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete board");
    }
  }, []);

  const getMembers = useCallback(
    async (boardId: string): Promise<BoardMemberWithUser[]> => {
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (!res.ok) {
        throw new Error("Failed to fetch members");
      }
      return res.json();
    },
    []
  );

  const addMember = useCallback(
    async (
      boardId: string,
      input: AddMemberInput
    ): Promise<BoardMemberWithUser> => {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add member");
      }
      return res.json();
    },
    []
  );

  const removeMember = useCallback(
    async (boardId: string, userId: string): Promise<void> => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove member");
      }
    },
    []
  );

  const getSnapshot = useCallback(
    async (
      boardId: string
    ): Promise<{ snapshot: string | null; version: number }> => {
      const res = await fetch(`/api/boards/${boardId}/snapshot`);
      if (!res.ok) {
        throw new Error("Failed to fetch snapshot");
      }
      return res.json();
    },
    []
  );

  const saveSnapshot = useCallback(
    async (boardId: string, snapshot: string): Promise<void> => {
      const res = await fetch(`/api/boards/${boardId}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save snapshot");
      }
    },
    []
  );

  return {
    getBoards,
    createBoard,
    getBoard,
    updateBoard,
    deleteBoard,
    getMembers,
    addMember,
    removeMember,
    getSnapshot,
    saveSnapshot,
  };
}
