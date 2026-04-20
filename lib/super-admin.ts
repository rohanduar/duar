import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSuperAdminSession() {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return null;
  }

  return session;
}

export async function getSuperAdminDashboardStats() {
  const [totalSchools, totalAdmins] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({
      where: { role: "admin" },
    }),
  ]);

  return { totalSchools, totalAdmins };
}

export async function getSuperAdminDashboardInsights() {
  const [stats, recentActivities, schools] = await Promise.all([
    getSuperAdminDashboardStats(),
    prisma.activityLog.findMany({
      orderBy: {
        created_at: "desc",
      },
      take: 5,
      select: {
        log_id: true,
        user_name: true,
        role: true,
        action: true,
        description: true,
        created_at: true,
      },
    }),
    prisma.school.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        school_id: true,
        name: true,
        users: {
          where: {
            role: "admin",
          },
          select: {
            user_id: true,
          },
        },
      },
    }),
  ]);

  const schoolAdminSummary = schools.map((school) => ({
    school_id: school.school_id,
    school_name: school.name,
    admin_count: school.users.length,
  }));

  return {
    ...stats,
    recentActivities,
    schoolAdminSummary,
  };
}

export async function getSchoolsList() {
  return prisma.school.findMany({
    orderBy: { created_at: "desc" },
    select: {
      school_id: true,
      name: true,
      created_at: true,
    },
  });
}

export async function getAdminsList() {
  return prisma.user.findMany({
    where: { role: "admin" },
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
