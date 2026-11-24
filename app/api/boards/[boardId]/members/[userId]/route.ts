import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole } from "@/lib/permissions";

// DELETE /api/boards/[boardId]/members/[userId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ boardId: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, userId } = await params;
  const currentUserId = session.user.id;
  const currentRole = await getUserBoardRole(boardId, currentUserId);

  // A user can remove themselves (leave board) OR owner can remove anyone
  const isSelf = currentUserId === userId;
  const isOwner = currentRole === "owner";

  if (!isSelf && !isOwner) {
    return NextResponse.json({ error: "Forbidden: Cannot remove this member" }, { status: 403 });
  }

  // Prevent removing the board owner
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });

  if (board?.ownerId === userId) {
    return NextResponse.json({ error: "Cannot remove board owner" }, { status: 400 });
  }

  try {
    await prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
