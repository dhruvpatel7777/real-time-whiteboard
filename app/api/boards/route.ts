import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBoardSchema } from "@/types/board";

// GET /api/boards - List all boards user has access to
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const formatted = boards.map((b) => {
    let role = "viewer";
    if (b.ownerId === userId) {
      role = "owner";
    } else if (b.members[0]) {
      role = b.members[0].role;
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

  return NextResponse.json(formatted);
}

// POST /api/boards - Create a new board
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createBoardSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description } = parsed.data;
    const userId = session.user.id;

    const board = await prisma.board.create({
      data: {
        title,
        description: description || "",
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: board.id,
        title: board.title,
        description: board.description,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        ownerId: board.ownerId,
        owner: board.owner,
        role: "owner",
        memberCount: 1,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create board:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
