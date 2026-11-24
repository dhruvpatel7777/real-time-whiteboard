import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole } from "@/lib/permissions";
import { BoardEditorClient } from "@/components/board/BoardEditorClient";
import { BoardDetail, BoardRole } from "@/types/board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { boardId } = await params;
  const userId = session.user.id;

  const role = await getUserBoardRole(boardId, userId);
  if (!role) {
    redirect("/dashboard?error=forbidden");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, color: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, color: true },
          },
        },
      },
      snapshots: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      },
    },
  });

  if (!board) {
    notFound();
  }

  const formattedBoard: BoardDetail = {
    id: board.id,
    title: board.title,
    description: board.description,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    ownerId: board.ownerId,
    owner: board.owner,
    role,
    hasSnapshot: board.snapshots.length > 0,
    members: board.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      boardId: m.boardId,
      role: m.role as BoardRole,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
  };

  const currentUser = {
    id: session.user.id,
    name: session.user.name || "Collaborator",
    email: session.user.email || "",
    color: session.user.color || "#38bdf8",
  };

  return (
    <BoardEditorClient
      board={formattedBoard}
      currentUser={currentUser}
      role={role}
    />
  );
}
