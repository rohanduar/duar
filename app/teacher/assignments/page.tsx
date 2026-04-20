import { redirect } from "next/navigation";
import { TeacherAssignmentsManager } from "@/components/teacher/assignments-manager";
import { getTeacherSession } from "@/lib/teacher";
import { prisma } from "@/lib/prisma";

export default async function TeacherAssignmentsPage() {
  const session = await getTeacherSession();
  const schoolId = session?.user.school_id;
  const teacherId = session?.user.id;

  if (!schoolId || !teacherId) {
    redirect("/teacher/classes");
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      class: {
        school_id: schoolId,
        teacher_id: teacherId,
      },
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      assignment_id: true,
      title: true,
      due_date: true,
      available_from: true,
      class: {
        select: {
          name: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      },
      submissions: {
        select: {
          score: true,
        },
      },
    },
  });

  return (
    <TeacherAssignmentsManager
      assignments={assignments.map((item) => ({
        assignment_id: item.assignment_id,
        class_name: item.class.name,
        title: item.title,
        due_date: item.due_date.toISOString(),
        available_from: item.available_from ? item.available_from.toISOString() : null,
        total_students: item.class._count.students,
        submitted_count: item.submissions.length,
        graded_count: item.submissions.filter((submission) => submission.score !== null).length,
      }))}
    />
  );
}
