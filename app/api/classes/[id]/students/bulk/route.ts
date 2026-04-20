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

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const class_id = id.trim();
  const school_id = session.user.school_id;

  const body = (await request.json()) as { student_ids?: string[] };
  const student_ids = Array.isArray(body.student_ids)
    ? Array.from(
        new Set(
          body.student_ids
            .map((studentId) => studentId?.trim())
            .filter((studentId): studentId is string => Boolean(studentId)),
        ),
      )
    : [];

  if (!class_id || !school_id || student_ids.length === 0) {
    return NextResponse.json(
      { message: "class id and student_ids are required" },
      { status: 400 },
    );
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id,
      school_id,
    },
    select: {
      class_id: true,
      name: true,
      students: {
        where: {
          user_id: { in: student_ids },
          role: "student",
          school_id,
        },
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  const validStudents = await prisma.user.findMany({
    where: {
      user_id: { in: student_ids },
      role: "student",
      school_id,
    },
    select: {
      user_id: true,
    },
  });

  const validStudentIds = validStudents.map((student) => student.user_id);
  const alreadyAssignedIds = new Set(
    classItem.students.map((student) => student.user_id),
  );
  const studentIdsToConnect = validStudentIds.filter(
    (studentId) => !alreadyAssignedIds.has(studentId),
  );

  if (studentIdsToConnect.length > 0) {
    await prisma.class.update({
      where: { class_id: classItem.class_id },
      data: {
        students: {
          connect: studentIdsToConnect.map((studentId) => ({ user_id: studentId })),
        },
      },
    });
  }

  await createActivityLog({
    action: "update",
    entity: "class_student",
    entity_id: classItem.class_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Admin added ${studentIdsToConnect.length} students to class ${classItem.name}`,
  });

  return NextResponse.json({
    message: "Students added to class",
    data: {
      requested: student_ids.length,
      added: studentIdsToConnect.length,
      skipped: student_ids.length - studentIdsToConnect.length,
    },
  });
}
