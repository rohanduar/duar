import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTeacherSession() {
  const session = await auth();
  if (!session || session.user.role !== "teacher" || !session.user.school_id) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: {
      school_id: session.user.school_id,
      teacher_id: session.user.id,
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      class_id: true,
      name: true,
      created_at: true,
      _count: {
        select: {
          students: true,
          assignments: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: classes.map((classItem) => ({
      class_id: classItem.class_id,
      class_name: classItem.name,
      created_at: classItem.created_at,
      _count: classItem._count,
    })),
  });
}
