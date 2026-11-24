import { prisma } from "@/lib/prisma";
import { BoardRole } from "@/types/board";

export async function getUserBoardRole(
  boardId: string,
  userId: string
): Promise<BoardRole | null> {
  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });

  if (member) {
    return member.role as BoardRole;
  }

  // Check if owner directly
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });

  if (board && board.ownerId === userId) {
    return "owner";
  }

  return null;
}

export function canEdit(role: BoardRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canManageMembers(role: BoardRole | null): boolean {
  return role === "owner";
}
