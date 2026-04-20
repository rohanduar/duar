import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 6;

async function getAdminSession() {
  const session = await auth();
  if (!session || session.user.role !== "admin" || !session.user.school_id) {
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
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const requestedPage = Number(searchParams.get("page")) || 1;
  const requestedLimit = Number(searchParams.get("limit")) || 10;
  const limit = Math.max(1, requestedLimit);
  const where: Prisma.UserWhereInput = {
    role: "student",
    school_id: session.user.school_id,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      {
        classes: {
          some: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const skip = (page - 1) * limit;

  const students = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { created_at: "desc" },
    select: {
      user_id: true,
      name: true,
      email: true,
      is_active: true,
      school_id: true,
      created_at: true,
      _count: {
        select: {
          classes: true,
        },
      },
      school: {
        select: {
          school_id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: students,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const school_id = session.user.school_id;

  if (!name || !email || !password || !school_id) {
    return NextResponse.json(
      { message: "name, email, password, and school_id are required" },
      { status: 400 },
    );
  }

  if (email !== undefined && !emailPattern.test(email)) {
    return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
  }

  if (password.length < minimumPasswordLength) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(password, 12);

  try {
    const student = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "student",
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
      entity: "student",
      entity_id: student.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: `${session.user.name} created student ${student.email}`,
    });

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) {
      return handled;
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    user_id?: string;
    name?: string;
    email?: string;
    password?: string;
    is_active?: boolean;
    reset_password?: boolean;
  };

  const user_id = body.user_id?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const school_id = session.user.school_id;
  const is_active = body.is_active;
  const reset_password = body.reset_password;

  if (!user_id || !school_id) {
    return NextResponse.json({ message: "user_id is required" }, { status: 400 });
  }

  if (typeof is_active === "boolean" && email === undefined) {
    const updateResult = await prisma.user.updateMany({
      where: {
        user_id,
        role: "student",
        school_id,
      },
      data: {
        is_active,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const student = await prisma.user.findFirst({
      where: {
        user_id,
        role: "student",
        school_id,
      },
      select: {
        user_id: true,
        email: true,
      },
    });

    await createActivityLog({
      action: "update",
      entity: "student",
      entity_id: student.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: `${session.user.name} ${is_active ? "enabled" : "disabled"} student ${student.email}`,
    });

    return NextResponse.json({ message: "Student status updated" });
  }

  if (reset_password) {
    const temporaryPassword = `Student#${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await hash(temporaryPassword, 12);

    const updateResult = await prisma.user.updateMany({
      where: {
        user_id,
        role: "student",
        school_id,
      },
      data: {
        password: hashedPassword,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const student = await prisma.user.findFirst({
      where: {
        user_id,
        role: "student",
        school_id,
      },
      select: {
        user_id: true,
        email: true,
      },
    });

    await createActivityLog({
      action: "update",
      entity: "student",
      entity_id: student.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description: `${session.user.name} reset password for student ${student.email}`,
    });

    return NextResponse.json({
      message: "Password reset successfully",
      temporary_password: temporaryPassword,
    });
  }

  if (!name && !email && !body.password && typeof is_active !== "boolean") {
    return NextResponse.json(
      { message: "No update payload provided" },
      { status: 400 },
    );
  }

  if ((name || email) && (!name || !email)) {
    return NextResponse.json(
      { message: "user_id, name, email, and school_id are required" },
      { status: 400 },
    );
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
  }

  if (body.password && body.password.trim().length < minimumPasswordLength) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
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
    const updateResult = await prisma.user.updateMany({
      where: {
        user_id,
        role: "student",
        school_id,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const student = await prisma.user.findFirst({
      where: {
        user_id,
        role: "student",
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

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    await createActivityLog({
      action: "update",
      entity: "student",
      entity_id: student.user_id,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
      description:
        typeof is_active === "boolean"
          ? `${session.user.name} ${is_active ? "enabled" : "disabled"} student ${student.email}`
          : `${session.user.name} updated student ${student.email}`,
    });

    return NextResponse.json({ data: student });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) {
      return handled;
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { user_id?: string };
  const user_id = body.user_id?.trim();
  const school_id = session.user.school_id;

  if (!user_id || !school_id) {
    return NextResponse.json({ message: "user_id is required" }, { status: 400 });
  }

  const student = await prisma.user.findFirst({
    where: {
      user_id,
      role: "student",
      school_id,
    },
    select: {
      user_id: true,
      email: true,
    },
  });

  if (!student) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const deleteResult = await prisma.user.deleteMany({
    where: {
      user_id: student.user_id,
      role: "student",
      school_id,
    },
  });

  if (deleteResult.count === 0) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  await createActivityLog({
    action: "delete",
    entity: "student",
    entity_id: student.user_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} deleted student ${student.email}`,
  });

  return NextResponse.json({ message: "Student deleted" });
}
