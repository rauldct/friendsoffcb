import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const user = await prisma.adminUser.create({
      data: { username, password: hash, name: name || "" },
      select: { id: true, username: true, name: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const count = await prisma.adminUser.count();
    if (count <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
