import { redirect } from "next/navigation";
import { ClassDetailManager } from "@/components/admin/class-detail-manager";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type ClassDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminClassDetailPage({ params }: ClassDetailPageProps) {
  const session = await getAdminSession();
  const schoolId = session?.user.school_id;

  if (!schoolId) {
    redirect("/admin/classes");
  }

  const { id } = await params;
  const classDetail = await prisma.class.findFirst({
    where: {
      class_id: id,
      school_id: schoolId,
    },
    include: {
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
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!classDetail) {
    redirect("/admin/classes");
  }

  return <ClassDetailManager classId={id} initialClassDetail={classDetail} />;
}
