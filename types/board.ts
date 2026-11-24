import { z } from "zod";

export type BoardRole = "owner" | "editor" | "viewer";

export interface BoardUserSummary {
  id: string;
  name: string;
  email: string;
  color?: string | null;
}

export interface BoardMemberWithUser {
  id: string;
  userId: string;
  boardId: string;
  role: BoardRole;
  createdAt: string;
  user: BoardUserSummary;
}

export interface BoardSummary {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: BoardUserSummary;
  role: BoardRole;
  memberCount: number;
}

export interface BoardDetail extends Omit<BoardSummary, "memberCount"> {
  members: BoardMemberWithUser[];
  hasSnapshot: boolean;
}

// Zod Schemas
export const createBoardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().trim().max(500, "Description is too long").optional(),
});
export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title is too long").optional(),
  description: z.string().trim().max(500, "Description is too long").optional(),
});
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export const addMemberSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  role: z.enum(["owner", "editor", "viewer"] as const),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const saveSnapshotSchema = z.object({
  snapshot: z.string().min(1, "Snapshot data is required"),
});
export type SaveSnapshotInput = z.infer<typeof saveSnapshotSchema>;

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message too long"),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export interface ChatMessageItem {
  id: string;
  boardId: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  createdAt: string;
}
