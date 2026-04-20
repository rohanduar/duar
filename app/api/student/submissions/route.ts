import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getStudentSession() {
  const session = await auth();
  if (!session || session.user.role !== "student" || !session.user.school_id) {
    return null;
  }
  return session;
}

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    assignment_id?: string;
    answer_text?: string | null;
    file_url?: string | null;
  };

  const assignment_id = body.assignment_id?.trim();
  const answer_text = body.answer_text?.trim() || null;
  const file_url = body.file_url?.trim() || null;

  if (!assignment_id) {
    return NextResponse.json({ message: "assignment_id is required" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      assignment_id,
      class: {
        school_id: session.user.school_id,
        students: {
          some: {
            user_id: session.user.id,
          },
        },
      },
    },
    select: {
      assignment_id: true,
      title: true,
    },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignment_id_student_id: {
        assignment_id: assignment.assignment_id,
        student_id: session.user.id,
      },
    },
    select: {
      submission_id: true,
    },
  });

  if (existingSubmission) {
    return NextResponse.json({ message: "Submission already exists" }, { status: 409 });
  }

  const submission = await prisma.submission.create({
    data: {
      assignment_id: assignment.assignment_id,
      student_id: session.user.id,
      answer_text,
      content: answer_text,
      file_url,
    },
    select: {
      submission_id: true,
      assignment_id: true,
      student_id: true,
      answer_text: true,
      file_url: true,
      submitted_at: true,
    },
  });

  await createActivityLog({
    action: "create",
    entity: "submission",
    entity_id: submission.submission_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Student submitted assignment ${assignment.title}`,
  });

  return NextResponse.json({ data: submission }, { status: 201 });
}
