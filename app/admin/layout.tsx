import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { getAdminSession } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      title="Admin Dashboard"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
