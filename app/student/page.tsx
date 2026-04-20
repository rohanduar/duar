import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, CheckCircle2, Clock3, ClipboardCheck, AlertTriangle } from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== "student" || !session.user.school_id) {
    redirect("/login");
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      class: {
        school_id: session.user.school_id,
        students: {
          some: {
            user_id: session.user.id,
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      assignment_id: true,
      title: true,
      due_date: true,
      available_from: true,
      created_at: true,
      class: {
        select: {
          name: true,
        },
      },
      submissions: {
        where: {
          student_id: session.user.id,
        },
        select: {
          submitted_at: true,
          score: true,
        },
      },
    },
  });

  const totalAssignments = assignments.length;
  const submitted = assignments.filter((assignment) => assignment.submissions.length > 0).length;
  const notSubmitted = totalAssignments - submitted;
  const graded = assignments.filter((assignment) => {
    const submission = assignment.submissions[0];
    return submission && submission.score !== null;
  }).length;
  const late = assignments.filter((assignment) => {
    const submission = assignment.submissions[0];
    return submission && submission.submitted_at > assignment.due_date;
  }).length;

  const latestAssignments = assignments.slice(0, 5);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{totalAssignments}</p>
              <p className="text-sm text-gray-500">Total Assignment</p>
            </div>
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{submitted}</p>
              <p className="text-sm text-gray-500">Submitted</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{notSubmitted}</p>
              <p className="text-sm text-gray-500">Not Submitted</p>
            </div>
            <Clock3 className="h-6 w-6 text-yellow-600" />
          </div>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{graded}</p>
              <p className="text-sm text-gray-500">Graded</p>
            </div>
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
          </div>
        </article>
        <article className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{late}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </article>
      </div>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900">Latest Assignments</h3>
        <div className="mt-4 space-y-3">
          {latestAssignments.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No assignments yet</p>
          ) : (
            latestAssignments.map((assignment) => {
              const submission = assignment.submissions[0];
              const now = new Date();
              const statusLabel = submission
                ? submission.submitted_at > assignment.due_date
                  ? "LATE"
                  : submission.score !== null
                    ? "GRADED"
                    : "SUBMITTED"
                : assignment.available_from && now < assignment.available_from
                  ? "NOT_AVAILABLE"
                  : "AVAILABLE";
              const statusClass =
                statusLabel === "NOT_AVAILABLE"
                  ? "bg-gray-100 text-gray-700"
                  : statusLabel === "AVAILABLE"
                    ? "bg-blue-100 text-blue-700"
                    : statusLabel === "SUBMITTED"
                      ? "bg-yellow-100 text-yellow-700"
                      : statusLabel === "GRADED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700";

              return (
                <div
                  key={assignment.assignment_id}
                  className="rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                      <p className="text-xs text-gray-500">{assignment.class.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Due: {new Date(assignment.due_date).toLocaleString()}
                      </p>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </article>
    </section>
  );
}
