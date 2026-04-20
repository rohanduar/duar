import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
  };

  const currentPassword = body.current_password ?? "";
  const newPassword = body.new_password ?? "";
  const confirmPassword = body.confirm_password ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { message: "All password fields are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ message: "Password too short" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { user_id: session.user.id },
    select: {
      user_id: true,
      password: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const validCurrentPassword = await compare(currentPassword, user.password);
  if (!validCurrentPassword) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(newPassword, 12);
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { password: hashedPassword },
  });

  await createActivityLog({
    action: "update",
    entity: "account",
    entity_id: user.user_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description:
      session.user.role === "super_admin"
        ? "Super Admin changed password"
        : session.user.role === "admin"
          ? "Admin changed password"
        : session.user.role === "teacher"
          ? "Teacher changed password"
        : session.user.role === "student"
          ? "Student changed password"
        : `${session.user.name} changed password`,
  });

  return NextResponse.json({ message: "Password updated successfully" });
}
