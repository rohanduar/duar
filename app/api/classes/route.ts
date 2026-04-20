import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getAdminSession() {
  const session = await auth();
  if (!session || session.user.role !== "admin" || !session.user.school_id) {
    return null;
  }
  return session;
}

async function validateTeacherInSchool(
  teacherId: string | null,
  schoolId: string,
) {
  if (!teacherId) {
    return true;
  }

  const teacher = await prisma.user.findFirst({
    where: {
      user_id: teacherId,
      role: "teacher",
      school_id: schoolId,
    },
    select: { user_id: true },
  });

  return Boolean(teacher);
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
  const where: Prisma.ClassWhereInput = {
    school_id: session.user.school_id,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      {
        teacher: {
          is: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const total = await prisma.class.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const skip = (page - 1) * limit;

  const classes = await prisma.class.findMany({
    where,
    skip,
    take: limit,
    orderBy: { created_at: "desc" },
    select: {
      class_id: true,
      name: true,
      school_id: true,
      teacher_id: true,
      created_at: true,
      teacher: {
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          students: true,
          assignments: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: classes,
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
    teacher_id?: string | null;
  };

  const name = body.name?.trim();
  const school_id = session.user.school_id;
  const teacher_id = body.teacher_id?.trim() || null;

  if (!name || !school_id) {
    return NextResponse.json(
      { message: "name and school_id are required" },
      { status: 400 },
    );
  }

  const validTeacher = await validateTeacherInSchool(teacher_id, school_id);
  if (!validTeacher) {
    return NextResponse.json(
      { message: "Selected teacher is invalid for this school" },
      { status: 400 },
    );
  }

  const classItem = await prisma.class.create({
    data: {
      name,
      school_id,
      teacher_id,
    },
    select: {
      class_id: true,
      name: true,
      school_id: true,
      teacher_id: true,
      created_at: true,
    },
  });

  await createActivityLog({
    action: "create",
    entity: "class",
    entity_id: classItem.class_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} created class ${classItem.name}`,
  });

  return NextResponse.json({ data: classItem }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    class_id?: string;
    name?: string;
    teacher_id?: string | null;
  };

  const class_id = body.class_id?.trim();
  const name = body.name?.trim();
  const school_id = session.user.school_id;
  const teacher_id = body.teacher_id?.trim() || null;

  if (!class_id || !name || !school_id) {
    return NextResponse.json(
      { message: "class_id, name, and school_id are required" },
      { status: 400 },
    );
  }

  const validTeacher = await validateTeacherInSchool(teacher_id, school_id);
  if (!validTeacher) {
    return NextResponse.json(
      { message: "Selected teacher is invalid for this school" },
      { status: 400 },
    );
  }

  const updateResult = await prisma.class.updateMany({
    where: {
      class_id,
      school_id,
    },
    data: {
      name,
      teacher_id,
    },
  });

  if (updateResult.count === 0) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id,
      school_id,
    },
    select: {
      class_id: true,
      name: true,
      school_id: true,
      teacher_id: true,
      created_at: true,
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  await createActivityLog({
    action: "update",
    entity: "class",
    entity_id: classItem.class_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} updated class ${classItem.name}`,
  });

  return NextResponse.json({ data: classItem });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { class_id?: string };
  const class_id = body.class_id?.trim();
  const school_id = session.user.school_id;

  if (!class_id || !school_id) {
    return NextResponse.json({ message: "class_id is required" }, { status: 400 });
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id,
      school_id,
    },
    select: {
      class_id: true,
      name: true,
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  const deleteResult = await prisma.class.deleteMany({
    where: {
      class_id: classItem.class_id,
      school_id,
    },
  });

  if (deleteResult.count === 0) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  await createActivityLog({
    action: "delete",
    entity: "class",
    entity_id: classItem.class_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} deleted class ${classItem.name}`,
  });

  return NextResponse.json({ message: "Class deleted" });
}
