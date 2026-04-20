import { NextResponse } from "next/server";
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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const classItem = await prisma.class.findFirst({
    where: {
      class_id: id,
      school_id: session.user.school_id,
    },
    select: {
      class_id: true,
      name: true,
      students: {
        where: {
          role: "student",
          school_id: session.user.school_id,
        },
        select: {
          user_id: true,
          name: true,
          email: true,
          school_id: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  return NextResponse.json({ data: classItem.students });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { student_id?: string };
  const student_id = body.student_id?.trim();
  const school_id = session.user.school_id;

  if (!student_id || !school_id) {
    return NextResponse.json({ message: "student_id is required" }, { status: 400 });
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id: id,
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

  const student = await prisma.user.findFirst({
    where: {
      user_id: student_id,
      role: "student",
      school_id,
    },
    select: {
      user_id: true,
      name: true,
      email: true,
    },
  });

  if (!student) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const duplicate = await prisma.class.findFirst({
    where: {
      class_id: classItem.class_id,
      school_id,
      students: {
        some: {
          user_id: student.user_id,
        },
      },
    },
    select: { class_id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: "Student is already assigned to this class" },
      { status: 409 },
    );
  }

  await prisma.class.update({
    where: { class_id: classItem.class_id },
    data: {
      students: {
        connect: { user_id: student.user_id },
      },
    },
  });

  await createActivityLog({
    action: "update",
    entity: "class_student",
    entity_id: classItem.class_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Admin added student ${student.email} to class ${classItem.name}`,
  });

  return NextResponse.json({ message: "Student assigned to class" }, { status: 201 });
}
