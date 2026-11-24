import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole } from "@/lib/permissions";
import { chatMessageSchema } from "@/types/board";

// GET /api/boards/[boardId]/chat - Recent messages
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      boardId: m.boardId,
      userId: m.userId,
      userName: m.userName,
      userColor: m.userColor,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

// POST /api/boards/[boardId]/chat - Send message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const role = await getUserBoardRole(boardId, session.user.id);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = chatMessageSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        boardId,
        userId: session.user.id,
        userName: session.user.name || "Anonymous",
        userColor: session.user.color || "#3b82f6",
        content: parsed.data.content,
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        boardId: message.boardId,
        userId: message.userId,
        userName: message.userName,
        userColor: message.userColor,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Chat message error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
