import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Password for demo users: "password123"
  const hashedPassword = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Designer",
      password: hashedPassword,
      color: "#f43f5e", // Rose
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Architect",
      password: hashedPassword,
      color: "#0ea5e9", // Sky
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      email: "charlie@example.com",
      name: "Charlie Viewer",
      password: hashedPassword,
      color: "#10b981", // Emerald
    },
  });

  // Create a demo board owned by Alice
  const demoBoard = await prisma.board.upsert({
    where: { id: "demo-board-1" },
    update: {},
    create: {
      id: "demo-board-1",
      title: "Team Architecture & Brainstorming",
      description: "Welcome to our collaborative whiteboard! Try drawing shapes, notes, and panning around.",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "owner" },
          { userId: bob.id, role: "editor" },
          { userId: charlie.id, role: "viewer" },
        ],
      },
    },
  });

  console.log("Database seeded successfully with demo users and board:", {
    users: [alice.email, bob.email, charlie.email],
    boardId: demoBoard.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
