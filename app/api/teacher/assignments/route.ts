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

export async function POST(request: Request) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    class_id?: string;
    title?: string;
    description?: string;
    material_link?: string | null;
    file_url?: string | null;
    due_date?: string;
    available_from?: string | null;
    available_until?: string | null;
  };

  const class_id = body.class_id?.trim();
  const title = body.title?.trim();
  const description = body.description?.trim();
  const material_link = body.material_link?.trim() || null;
  const file_url = body.file_url?.trim() || null;
  const due_date = body.due_date ? new Date(body.due_date) : null;
  const available_from = body.available_from ? new Date(body.available_from) : null;
  const available_until = body.available_until ? new Date(body.available_until) : null;

  if (!class_id || !title || !description || !due_date || Number.isNaN(due_date.getTime())) {
    return NextResponse.json(
      { message: "class_id, title, description, and due_date are required" },
      { status: 400 },
    );
  }

  if (available_from && Number.isNaN(available_from.getTime())) {
    return NextResponse.json({ message: "available_from is invalid" }, { status: 400 });
  }
  if (available_until && Number.isNaN(available_until.getTime())) {
    return NextResponse.json({ message: "available_until is invalid" }, { status: 400 });
  }

  const classItem = await prisma.class.findFirst({
    where: {
      class_id,
      school_id: session.user.school_id,
      teacher_id: session.user.id,
    },
    select: {
      class_id: true,
      name: true,
    },
  });

  if (!classItem) {
    return NextResponse.json({ message: "Class not found" }, { status: 404 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      class_id: classItem.class_id,
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
    action: "create",
    entity: "assignment",
    entity_id: assignment.assignment_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Teacher created assignment ${assignment.title}`,
  });

  return NextResponse.json({ data: assignment }, { status: 201 });
}
