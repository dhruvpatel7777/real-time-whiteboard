import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole, canEdit } from "@/lib/permissions";
import { updateBoardSchema } from "@/types/board";

// GET /api/boards/[boardId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const userId = session.user.id;

  const role = await getUserBoardRole(boardId, userId);
  if (!role) {
    return NextResponse.json({ error: "Forbidden: No access to this board" }, { status: 403 });
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
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json({
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
      role: m.role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
  });
}

// PATCH /api/boards/[boardId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const userId = session.user.id;

  const role = await getUserBoardRole(boardId, userId);
  if (!canEdit(role)) {
    return NextResponse.json({ error: "Forbidden: Editor or Owner role required" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = updateBoardSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update board error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/boards/[boardId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const userId = session.user.id;

  const role = await getUserBoardRole(boardId, userId);
  if (role !== "owner") {
    return NextResponse.json({ error: "Forbidden: Only the Owner can delete this board" }, { status: 403 });
  }

  try {
    await prisma.board.delete({
      where: { id: boardId },
    });
    return NextResponse.json({ message: "Board deleted successfully" });
  } catch (err) {
    console.error("Delete board error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
