import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentClassDetailManager } from "@/components/student/class-detail-manager";

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "student" || !session.user.school_id) {
    redirect("/login");
  }

  const { id } = await params;
  const classDetail = await prisma.class.findFirst({
    where: {
      class_id: id,
      school_id: session.user.school_id,
      students: {
        some: {
          user_id: session.user.id,
        },
      },
    },
    select: {
      class_id: true,
      name: true,
      assignments: {
        orderBy: {
          created_at: "desc",
        },
        select: {
          assignment_id: true,
          title: true,
          description: true,
          material_link: true,
          file_url: true,
          due_date: true,
          available_from: true,
          submissions: {
            where: {
              student_id: session.user.id,
            },
            select: {
              submission_id: true,
              assignment_id: true,
              student_id: true,
              answer_text: true,
              file_url: true,
              score: true,
              feedback: true,
              submitted_at: true,
            },
          },
        },
      },
    },
  });

  if (!classDetail) {
    redirect("/student/classes");
  }

  const now = new Date();
  const assignments = classDetail.assignments.map((assignment) => {
    const submission = assignment.submissions[0];
    let status:
      | "NOT_AVAILABLE"
      | "AVAILABLE"
      | "SUBMITTED"
      | "GRADED"
      | "LATE" = "AVAILABLE";

    if (submission) {
      if (submission.submitted_at > assignment.due_date) {
        status = "LATE";
      } else if (submission.score !== null) {
        status = "GRADED";
      } else {
        status = "SUBMITTED";
      }
    } else if (assignment.available_from && now < assignment.available_from) {
      status = "NOT_AVAILABLE";
    }

    return {
      ...assignment,
      status,
    };
  });

  return (
    <StudentClassDetailManager
      classDetail={{
        class_id: classDetail.class_id,
        class_name: classDetail.name,
        assignments,
      }}
    />
  );
}
