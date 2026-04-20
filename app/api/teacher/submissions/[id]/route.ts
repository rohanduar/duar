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

export async function PUT(request: Request, context: RouteContext) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const submissionId = id.trim();
  const body = (await request.json()) as {
    score?: number | null;
    feedback?: string | null;
  };

  if (!submissionId) {
    return NextResponse.json({ message: "submission id is required" }, { status: 400 });
  }

  const ownedSubmission = await prisma.submission.findFirst({
    where: {
      submission_id: submissionId,
      assignment: {
        class: {
          teacher_id: session.user.id,
          school_id: session.user.school_id,
        },
      },
    },
    select: {
      submission_id: true,
      student: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!ownedSubmission) {
    return NextResponse.json({ message: "Submission not found" }, { status: 404 });
  }

  const scoreValue =
    body.score === null || body.score === undefined || body.score === ""
      ? null
      : Number(body.score);
  if (scoreValue !== null && Number.isNaN(scoreValue)) {
    return NextResponse.json({ message: "score is invalid" }, { status: 400 });
  }

  const updated = await prisma.submission.update({
    where: {
      submission_id: ownedSubmission.submission_id,
    },
    data: {
      score: scoreValue,
      feedback: body.feedback?.trim() ? body.feedback.trim() : null,
    },
    select: {
      submission_id: true,
      score: true,
      feedback: true,
      submitted_at: true,
      student: {
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await createActivityLog({
    action: "update",
    entity: "submission",
    entity_id: updated.submission_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `Teacher graded submission of student ${ownedSubmission.student.name}`,
  });

  return NextResponse.json({ data: updated });
}
