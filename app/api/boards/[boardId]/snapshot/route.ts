import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole, canEdit } from "@/lib/permissions";
import { saveSnapshotSchema } from "@/types/board";

// GET /api/boards/[boardId]/snapshot - Get latest snapshot for board
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const role = await getUserBoardRole(boardId, session.user.id);
  if (!role) {
    return NextResponse.json({ error: "Forbidden: No access to this board" }, { status: 403 });
  }

  const snapshot = await prisma.boardSnapshot.findFirst({
    where: { boardId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      snapshot: true,
      version: true,
      updatedAt: true,
      userId: true,
    },
  });

  return NextResponse.json({ snapshot: snapshot?.snapshot || null, version: snapshot?.version || 0 });
}

// POST /api/boards/[boardId]/snapshot - Save snapshot to SQLite (autosave)
export async function POST(
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
    return NextResponse.json({ error: "Forbidden: Only editors or owners can save board state" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = saveSnapshotSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid snapshot data" }, { status: 400 });
    }

    // Upsert or insert new snapshot record
    const existing = await prisma.boardSnapshot.findFirst({
      where: { boardId },
      orderBy: { updatedAt: "desc" },
    });

    let savedSnapshot;
    if (existing) {
      savedSnapshot = await prisma.boardSnapshot.update({
        where: { id: existing.id },
        data: {
          snapshot: parsed.data.snapshot,
          version: existing.version + 1,
          userId,
        },
      });
    } else {
      savedSnapshot = await prisma.boardSnapshot.create({
        data: {
          boardId,
          snapshot: parsed.data.snapshot,
          version: 1,
          userId,
        },
      });
    }

    // Touch board updatedAt
    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      version: savedSnapshot.version,
      savedAt: savedSnapshot.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("Save snapshot error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
