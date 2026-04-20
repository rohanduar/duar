import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/teacher";
import { prisma } from "@/lib/prisma";
import { AssignmentDetailManager } from "@/components/teacher/assignment-detail-manager";

type AssignmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssignmentDetailPage({
  params,
}: AssignmentDetailPageProps) {
  const session = await getTeacherSession();
  const schoolId = session?.user.school_id;
  const teacherId = session?.user.id;

  if (!schoolId || !teacherId) {
    redirect("/teacher/classes");
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findFirst({
    where: {
      assignment_id: id,
      class: {
        school_id: schoolId,
        teacher_id: teacherId,
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
          class_id: true,
          name: true,
          students: {
            where: {
              role: "student",
              school_id: schoolId,
            },
            select: {
              user_id: true,
              name: true,
              email: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      },
      submissions: {
        include: {
          student: {
            select: {
              user_id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          submitted_at: "desc",
        },
      },
    },
  });

  if (!assignment) {
    redirect("/teacher/classes");
  }

  return (
    <AssignmentDetailManager
      assignment={{
        assignment_id: assignment.assignment_id,
        class_id: assignment.class_id,
        title: assignment.title,
        description: assignment.description,
        material_link: assignment.material_link,
        file_url: assignment.file_url,
        due_date: assignment.due_date.toISOString(),
        available_from: assignment.available_from
          ? assignment.available_from.toISOString()
          : null,
        available_until: assignment.available_until
          ? assignment.available_until.toISOString()
          : null,
        created_at: assignment.created_at.toISOString(),
        class_name: assignment.class.name,
        students: assignment.class.students,
        submissions: assignment.submissions.map((submission) => ({
          submission_id: submission.submission_id,
          student_id: submission.student.user_id,
          submitted_at: submission.submitted_at.toISOString(),
          answer_text: submission.answer_text,
          file_url: submission.file_url,
          score: submission.score,
          feedback: submission.feedback,
          student: submission.student,
        })),
      }}
    />
  );
}
