import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTeacherSession() {
  const session = await auth();

  if (!session || session.user.role !== "teacher") {
    return null;
  }

  return session;
}

export async function getTeacherDashboardStats() {
  const session = await getTeacherSession();
  const schoolId = session?.user.school_id;
  const teacherId = session?.user.id;

  if (!schoolId || !teacherId) {
    return {
      totalClasses: 0,
      totalAssignments: 0,
      totalSubmissions: 0,
      totalUngraded: 0,
    };
  }

  const classes = await prisma.class.findMany({
    where: {
      school_id: schoolId,
      teacher_id: teacherId,
    },
    select: {
      assignments: {
        select: {
          _count: {
            select: {
              submissions: true,
            },
          },
          submissions: {
            where: {
              score: null,
            },
            select: {
              submission_id: true,
            },
          },
        },
      },
    },
  });

  const totalClasses = classes.length;
  const totalAssignments = classes.reduce((total, classItem) => {
    return total + classItem.assignments.length;
  }, 0);
  const totalSubmissions = classes.reduce((total, classItem) => {
    const classSubmissionCount = classItem.assignments.reduce((assignmentTotal, assignment) => {
      return assignmentTotal + assignment._count.submissions;
    }, 0);
    return total + classSubmissionCount;
  }, 0);
  const totalUngraded = classes.reduce((total, classItem) => {
    const classUngradedCount = classItem.assignments.reduce((assignmentTotal, assignment) => {
      return assignmentTotal + assignment.submissions.length;
    }, 0);
    return total + classUngradedCount;
  }, 0);

  return {
    totalClasses,
    totalAssignments,
    totalSubmissions,
    totalUngraded,
  };
}

export async function getTeacherDashboardInsights() {
  const session = await getTeacherSession();
  const schoolId = session?.user.school_id;
  const teacherId = session?.user.id;

  if (!schoolId || !teacherId) {
    return {
      totalClasses: 0,
      totalAssignments: 0,
      totalSubmissions: 0,
      totalUngraded: 0,
      recentActivities: [] as Array<{
        log_id: string;
        description: string;
        created_at: Date;
      }>,
    };
  }

  const [stats, recentActivities] = await Promise.all([
    getTeacherDashboardStats(),
    prisma.activityLog.findMany({
      where: {
        role: "teacher",
        user_name: session.user.name,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 8,
      select: {
        log_id: true,
        description: true,
        created_at: true,
      },
    }),
  ]);

  return {
    ...stats,
    recentActivities,
  };
}
