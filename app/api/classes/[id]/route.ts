import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      students: {
        where: {
          role: "student",
          school_id: session.user.school_id,
        },
        select: {
          user_id: true,
          name: true,
          email: true,
        },
        orderBy: { created_at: "desc" },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  return NextResponse.json({ data: classItem });
}
