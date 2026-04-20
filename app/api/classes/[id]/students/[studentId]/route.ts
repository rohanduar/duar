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
    studentId: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id, studentId } = await context.params;
  const class_id = id.trim();
  const student_id = studentId.trim();
  const school_id = session.user.school_id;

  if (!class_id || !student_id || !school_id) {
    return NextResponse.json(
      { message: "class id and student id are required" },
      { status: 400 },
    );
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id,
      school_id,
      students: {
        some: {
          user_id: student_id,
          role: "student",
          school_id,
        },
      },
    },
    select: {
      class_id: true,
      name: true,
      students: {
        where: { user_id: student_id },
        select: {
          user_id: true,
          email: true,
        },
      },
    },
  });

  if (!classItem || classItem.students.length === 0) {
    return NextResponse.json(
      { message: "Student assignment not found" },
      { status: 404 },
    );
  }

  const student = classItem.students[0];

  await prisma.class.update({
    where: { class_id: classItem.class_id },
    data: {
      students: {
        disconnect: { user_id: student.user_id },
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
    description: `Admin removed student ${student.email} from class ${classItem.name}`,
  });

  return NextResponse.json({ message: "Student removed from class" });
}
