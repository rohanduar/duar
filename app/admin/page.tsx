import Link from "next/link";
import { BookOpen, GraduationCap, UserMinus, Users, ArrowRight } from "lucide-react";
import { getAdminDashboardInsights } from "@/lib/admin";

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

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardInsights();

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/admin/classes"
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
          href="/admin/students"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalStudents}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Students</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Students
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
        <Link
          href="/admin/teachers"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalTeachers}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Teachers</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Teachers
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
        <article className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.classesWithoutTeacher}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Classes Without Teacher</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <UserMinus className="h-6 w-6" />
            </div>
          </div>
          {dashboard.classesWithoutTeacher > 0 ? (
            <p className="mt-4 inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              Warning: Assign teachers to pending classes
            </p>
          ) : (
            <p className="mt-4 inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              All classes already have teacher
            </p>
          )}
        </article>
      </div>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
        <div className="mt-4 space-y-3">
          {dashboard.recentActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No data available</p>
          ) : (
            dashboard.recentActivities.map((activity: any) => (
              <div
                key={activity.log_id}
                className="rounded-lg border border-gray-200 px-4 py-3"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {activity.user_name}
                  <span className="ml-2 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {activity.role}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-700">{activity.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatReadableDateTime(activity.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
