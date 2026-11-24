import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserBoardRole } from "@/lib/permissions";
import { addMemberSchema } from "@/types/board";

// GET /api/boards/[boardId]/members
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

  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: {
      user: {
        select: { id: true, name: true, email: true, color: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      boardId: m.boardId,
      role: m.role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    }))
  );
}

// POST /api/boards/[boardId]/members - Invite / add member by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const currentRole = await getUserBoardRole(boardId, session.user.id);
  if (currentRole !== "owner" && currentRole !== "editor") {
    return NextResponse.json({ error: "Forbidden: Owner or Editor role required to invite" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = addMemberSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, role } = parsed.data;
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `No user found with email ${email}. Ask them to register first!` },
        { status: 404 }
      );
    }

    // Upsert membership
    const member = await prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
      update: {
        role,
      },
      create: {
        boardId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
    });

    return NextResponse.json({
      id: member.id,
      userId: member.userId,
      boardId: member.boardId,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      user: member.user,
    });
  } catch (err) {
    console.error("Add member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
