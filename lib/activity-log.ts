import { prisma } from "@/lib/prisma";

type LoggableRole = "super_admin" | "admin" | "teacher" | "student";

const allowedRoles: LoggableRole[] = ["super_admin", "admin", "teacher", "student"];

type CreateActivityLogParams = {
  action: "create" | "update" | "delete";
  entity?: string;
  entity_id?: string | null;
  description: string;
  user: {
    id: string;
    name?: string | null;
    role: string;
  };
};

export async function createActivityLog(params: CreateActivityLogParams) {
  const { user } = params;
  if (!allowedRoles.includes(user.role as LoggableRole)) {
    return;
  }

  try {
    await prisma.activityLog.create({
      data: {
        user_name: user.name?.trim() || "Unknown User",
        role: user.role,
        action: params.action,
        description: params.description,
      },
    });
  } catch (error) {
    console.error("Activity log write failed:", error);
  }
}
