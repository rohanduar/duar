import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getTeacherSession() {
  const session = await auth();
  if (!session || session.user.role !== "teacher") {
    return null;
  }
  return session;
}

export async function PUT(request: Request) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    password?: string;
  };

  const name = body.name?.trim() || "";
  const password = body.password?.trim() || "";

  if (!name) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { user_id: session.user.id },
    select: {
      user_id: true,
      name: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const dataToUpdate: {
    name: string;
    password?: string;
  } = {
    name,
  };

  if (password) {
    dataToUpdate.password = await hash(password, 12);
  }

  const updatedUser = await prisma.user.update({
    where: { user_id: user.user_id },
    data: dataToUpdate,
    select: {
      user_id: true,
      name: true,
      email: true,
    },
  });

  if (user.name !== name) {
    await createActivityLog({
      action: "update",
      entity: "account",
      entity_id: user.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: "Teacher updated account name",
    });
  }

  if (password) {
    await createActivityLog({
      action: "update",
      entity: "account",
      entity_id: user.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: "Teacher updated account password",
    });
  }

  return NextResponse.json({
    message: "Account updated successfully",
    data: updatedUser,
  });
}
