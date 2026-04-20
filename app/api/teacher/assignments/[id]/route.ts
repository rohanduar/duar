import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getTeacherSession() {
  const session = await auth();
  if (!session || session.user.role !== "teacher" || !session.user.school_id) {
    return null;
  }
  return session;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getOwnedAssignment(assignmentId: string, teacherId: string, schoolId: string) {
  return prisma.assignment.findFirst({
    where: {
      assignment_id: assignmentId,
      class: {
        teacher_id: teacherId,
        school_id: schoolId,
      },
    },
    select: {
      assignment_id: true,
      class_id: true,
      title: true,
      description: true,
      material_link: true,
      file_url: true,
      due_date: true,
      available_from: true,
      available_until: true,
      created_at: true,
      class: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const assignmentId = id.trim();
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    material_link?: string | null;
    file_url?: string | null;
    due_date?: string;
    available_from?: string | null;
    available_until?: string | null;
  };

  const title = body.title?.trim();
  const description = body.description?.trim();
  const material_link = body.material_link?.trim() || null;
  const file_url = body.file_url?.trim() || null;
  const due_date = body.due_date ? new Date(body.due_date) : null;
  const available_from = body.available_from ? new Date(body.available_from) : null;
  const available_until = body.available_until ? new Date(body.available_until) : null;

  if (!assignmentId || !title || !description || !due_date || Number.isNaN(due_date.getTime())) {
    return NextResponse.json(
      { message: "assignment id, title, description, and due_date are required" },
      { status: 400 },
    );
  }

  if (available_from && Number.isNaN(available_from.getTime())) {
    return NextResponse.json({ message: "available_from is invalid" }, { status: 400 });
  }
  if (available_until && Number.isNaN(available_until.getTime())) {
    return NextResponse.json({ message: "available_until is invalid" }, { status: 400 });
  }

  const assignment = await getOwnedAssignment(
    assignmentId,
    session.user.id,
    session.user.school_id!,
  );
  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  const updated = await prisma.assignment.update({
    where: { assignment_id: assignment.assignment_id },
    data: {
      title,
      description,
      material_link,
      file_url,
      due_date,
      available_from,
      available_until,
    },
    select: {
      assignment_id: true,
      class_id: true,
      title: true,
      description: true,
      material_link: true,
      file_url: true,
      due_date: true,
      available_from: true,
      available_until: true,
      created_at: true,
    },
  });

  await createActivityLog({
    action: "update",
    entity: "assignment",
    entity_id: updated.assignment_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Teacher updated assignment ${updated.title}`,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const assignmentId = id.trim();

  if (!assignmentId) {
    return NextResponse.json({ message: "assignment id is required" }, { status: 400 });
  }

  const assignment = await getOwnedAssignment(
    assignmentId,
    session.user.id,
    session.user.school_id!,
  );
  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  await prisma.assignment.delete({
    where: { assignment_id: assignment.assignment_id },
  });

  await createActivityLog({
    action: "delete",
    entity: "assignment",
    entity_id: assignment.assignment_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Teacher deleted assignment ${assignment.title}`,
  });

  return NextResponse.json({ message: "Assignment deleted" });
}
