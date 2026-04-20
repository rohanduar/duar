import Link from "next/link";
import { BookOpen, FileText, Inbox, ClipboardList, ArrowRight, Plus } from "lucide-react";
import { getTeacherDashboardInsights } from "@/lib/teacher";

function formatReadableDateTime(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function TeacherDashboardPage() {
  const dashboard = await getTeacherDashboardInsights();

  return (
    <section className="space-y-5">

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/teacher/classes"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalClasses}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Classes</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Classes
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/teacher/classes"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalAssignments}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Assignments</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Assignment List
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/teacher/classes"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalSubmissions}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Submissions</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Inbox className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Submission View
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <article className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalUngraded}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Ungraded</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            {dashboard.totalUngraded} submissions need grading
          </p>
        </article>
      </div>
    </section>
  );
}
