import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminSession() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function getAdminDashboardStats() {
  const session = await getAdminSession();
  const schoolId = session?.user.school_id;

  if (!schoolId) {
    return {
      totalTeachers: 0,
      totalStudents: 0,
      totalClasses: 0,
      classesWithoutTeacher: 0,
    };
  }

  const [totalTeachers, totalStudents, totalClasses, classesWithoutTeacher] =
    await Promise.all([
    prisma.user.count({
      where: {
        role: "teacher",
        school_id: schoolId,
      },
    }),
    prisma.user.count({
      where: {
        role: "student",
        school_id: schoolId,
      },
    }),
    prisma.class.count({
      where: {
        school_id: schoolId,
      },
    }),
    prisma.class.count({
      where: {
        school_id: schoolId,
        teacher_id: null,
      },
    }),
  ]);

  return {
    totalTeachers,
    totalStudents,
    totalClasses,
    classesWithoutTeacher,
  };
}

export async function getAdminDashboardInsights() {
  const session = await getAdminSession();
  const schoolId = session?.user.school_id;

  if (!schoolId) {
    return {
      totalTeachers: 0,
      totalStudents: 0,
      totalClasses: 0,
      classesWithoutTeacher: 0,
      recentActivities: [] as Array<{
        log_id: string;
        user_name: string;
        role: string;
        description: string;
        created_at: Date;
      }>,
    };
  }

  const statsPromise = getAdminDashboardStats();
  const schoolUsersPromise = prisma.user.findMany({
    where: {
      school_id: schoolId,
    },
    select: {
      name: true,
    },
  });

  const [stats, schoolUsers] = await Promise.all([statsPromise, schoolUsersPromise]);
  const schoolUserNames = schoolUsers.map((user) => user.name);

  const recentActivities = await prisma.activityLog.findMany({
    where: {
      user_name: {
        in: schoolUserNames,
      },
      role: {
        not: "super_admin",
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 8,
    select: {
      log_id: true,
      user_name: true,
      role: true,
      description: true,
      created_at: true,
    },
  });

  return {
    ...stats,
    recentActivities,
  };
}

export async function getTeachersList() {
  return prisma.user.findMany({
    where: { role: "teacher" },
    orderBy: { created_at: "desc" },
    select: {
      user_id: true,
      name: true,
      email: true,
      created_at: true,
      school: {
        select: { name: true },
      },
    },
  });
}
