export const dashboardByRole: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export function getDashboardPathByRole(role?: string | null): string {
  if (!role) {
    return "/login";
  }

  return dashboardByRole[role] ?? "/login";
}
