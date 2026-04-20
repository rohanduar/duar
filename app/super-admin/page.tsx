import Link from "next/link";
import { getSuperAdminDashboardInsights } from "@/lib/super-admin";
import { School, ShieldCheck, ArrowRight, Plus } from "lucide-react";

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

export default async function SuperAdminDashboardPage() {
  const dashboard = await getSuperAdminDashboardInsights();

  return (
    <section className="space-y-5">
      
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/super-admin/schools"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalSchools}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Schools</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <School className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Schools
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
        <Link
          href="/super-admin/admins"
          className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {dashboard.totalAdmins}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Total Admins</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
            Open Admins
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-md">
          <h4 className="text-lg font-semibold text-gray-900">Admin per School</h4>
          <div className="mt-4 space-y-3">
            {dashboard.schoolAdminSummary.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No data available</p>
            ) : (
              dashboard.schoolAdminSummary.map((school) => (
                <div
                  key={school.school_id}
                  className="rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{school.school_name}</p>
                    <p className="text-sm font-medium text-gray-700">
                      {school.admin_count} Admin
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {school.admin_count === 0 ? (
                      <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        No Admin
                      </span>
                    ) : null}
                    {school.admin_count > 3 ? (
                      <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        Many Admins
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl bg-white p-6 shadow-md">
          <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
          <div className="mt-4 space-y-3">
            {dashboard.recentActivities.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No data available</p>
            ) : (
              dashboard.recentActivities.map((activity) => (
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
      </div>
    </section>
  );
}
    

