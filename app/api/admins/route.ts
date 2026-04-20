import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getSuperAdminSession() {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return null;
  }
  return session;
}

function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }
  }

  throw error;
}

export async function GET(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const school_id = searchParams.get("school_id")?.trim();

  const admins = await prisma.user.findMany({
    where: {
      role: "admin",
      ...(school_id ? { school_id } : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      user_id: true,
      name: true,
      email: true,
      is_active: true,
      school_id: true,
      created_at: true,
      school: {
        select: {
          school_id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ data: admins });
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    school_id?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const school_id = body.school_id?.trim();

  if (!name || !email || !password || !school_id) {
    return NextResponse.json(
      { message: "name, email, password, and school_id are required" },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(password, 12);

  try {
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
        school_id,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        is_active: true,
        school_id: true,
        created_at: true,
      },
    });

    await createActivityLog({
      action: "create",
      entity: "admin",
      entity_id: admin.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: `${session.user.name} created admin ${admin.email}`,
    });

    return NextResponse.json({ data: admin }, { status: 201 });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) {
      return handled;
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    user_id?: string;
    name?: string;
    email?: string;
    password?: string;
    school_id?: string;
    is_active?: boolean;
    reset_password?: boolean;
  };

  const user_id = body.user_id?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const school_id = body.school_id?.trim();
  const is_active = body.is_active;
  const reset_password = body.reset_password;

  if (!user_id) {
    return NextResponse.json({ message: "user_id is required" }, { status: 400 });
  }

  if (reset_password) {
    const temporaryPassword = `Admin#${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await hash(temporaryPassword, 12);
    const admin = await prisma.user.update({
      where: { user_id },
      data: { password: hashedPassword },
      select: {
        user_id: true,
        email: true,
      },
    });

    await createActivityLog({
      action: "update",
      entity: "admin",
      entity_id: admin.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: `${session.user.name} reset password for admin ${admin.email}`,
    });

    return NextResponse.json({
      message: "Password reset successfully",
      temporary_password: temporaryPassword,
    });
  }

  if (!name && !email && !school_id && typeof is_active !== "boolean" && !body.password) {
    return NextResponse.json(
      { message: "No update payload provided" },
      { status: 400 },
    );
  }

  if ((name || email || school_id) && (!name || !email || !school_id)) {
    return NextResponse.json(
      { message: "user_id, name, email, and school_id are required" },
      { status: 400 },
    );
  }

  const updateData: {
    name?: string;
    email?: string;
    school_id?: string;
    is_active?: boolean;
    password?: string;
  } = {};

  if (name) {
    updateData.name = name;
  }
  if (email) {
    updateData.email = email;
  }
  if (school_id) {
    updateData.school_id = school_id;
  }
  if (typeof is_active === "boolean") {
    updateData.is_active = is_active;
  }

  if (body.password && body.password.trim()) {
    updateData.password = await hash(body.password, 12);
  }

  try {
    const admin = await prisma.user.update({
      where: { user_id },
      data: updateData,
      select: {
        user_id: true,
        name: true,
        email: true,
        is_active: true,
        school_id: true,
        created_at: true,
      },
    });

    await createActivityLog({
      action: "update",
      entity: "admin",
      entity_id: admin.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description:
        typeof is_active === "boolean"
          ? `${session.user.name} ${is_active ? "enabled" : "disabled"} admin ${admin.email}`
          : `${session.user.name} updated admin ${admin.email}`,
    });

    return NextResponse.json({ data: admin });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) {
      return handled;
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { user_id?: string };
  const user_id = body.user_id?.trim();

  if (!user_id) {
    return NextResponse.json({ message: "user_id is required" }, { status: 400 });
  }

  const admin = await prisma.user.delete({
    where: { user_id },
    select: {
      user_id: true,
      email: true,
    },
  });

  await createActivityLog({
    action: "delete",
    entity: "admin",
    entity_id: admin.user_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} deleted admin ${admin.email}`,
  });

  return NextResponse.json({ message: "Admin deleted" });
}
