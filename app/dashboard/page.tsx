import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { BoardSummary, BoardRole } from "@/types/board";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, color: true },
      },
      members: {
        where: { userId },
        select: { role: true },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedBoards: BoardSummary[] = boards.map((b) => {
    let role: BoardRole = "viewer";
    if (b.ownerId === userId) {
      role = "owner";
    } else if (b.members[0]) {
      role = b.members[0].role as BoardRole;
    }

    return {
      id: b.id,
      title: b.title,
      description: b.description,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      ownerId: b.ownerId,
      owner: b.owner,
      role,
      memberCount: b._count.members,
    };
  });

  const currentUser = {
    id: session.user.id,
    name: session.user.name || "Collaborator",
    email: session.user.email || "",
    color: session.user.color || "#38bdf8",
  };

  return (
    <DashboardClient
      initialBoards={formattedBoards}
      currentUser={currentUser}
    />
  );
}
