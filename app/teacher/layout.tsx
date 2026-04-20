import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/teacher/dashboard-shell";
import { getTeacherSession } from "@/lib/teacher";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTeacherSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      title="Teacher Dashboard"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
