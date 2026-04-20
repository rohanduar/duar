import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/super-admin/dashboard-shell";
import { getSuperAdminSession } from "@/lib/super-admin";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSuperAdminSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      title="Super Admin Dashboard"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
