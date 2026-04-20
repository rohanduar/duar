import { redirect } from "next/navigation";
import { TeacherClassDetailManager } from "@/components/teacher/class-detail-manager";
import { getTeacherSession } from "@/lib/teacher";
import { prisma } from "@/lib/prisma";

type TeacherClassDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherClassDetailPage({
  params,
}: TeacherClassDetailPageProps) {
  const session = await getTeacherSession();
  const schoolId = session?.user.school_id;
  const teacherId = session?.user.id;

  if (!schoolId || !teacherId) {
    redirect("/teacher/classes");
  }

  const { id } = await params;

  const classDetail = await prisma.class.findFirst({
    where: {
      class_id: id,
      school_id: schoolId,
      teacher_id: teacherId,
    },
    select: {
      class_id: true,
      name: true,
      _count: {
        select: {
          students: true,
        },
      },
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
          created_at: "desc",
        },
      },
      assignments: {
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
          submissions: {
            select: {
              submitted_at: true,
              score: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!classDetail) {
    redirect("/teacher/classes");
  }

  return (
    <TeacherClassDetailManager
      classDetail={{
        class_id: classDetail.class_id,
        class_name: classDetail.name,
        total_students: classDetail._count.students,
        students: classDetail.students,
        assignments: classDetail.assignments,
      }}
    />
  );
}
