"use client";

import Link from "next/link";

type AssignmentItem = {
  assignment_id: string;
  class_name: string;
  title: string;
  due_date: string;
  available_from: string | null;
  total_students: number;
  submitted_count: number;
  graded_count: number;
};

type TeacherAssignmentsManagerProps = {
  assignments: AssignmentItem[];
};

export function TeacherAssignmentsManager({
  assignments,
}: TeacherAssignmentsManagerProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Assignments</h3>
      </div>

      {assignments.length === 0 ? (
        <article className="rounded-xl bg-white p-6 shadow-md">
          <p className="text-sm text-gray-400">No assignments available</p>
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment) => {
            const now = new Date();
            const dueDate = new Date(assignment.due_date);
            const availableFrom = assignment.available_from
              ? new Date(assignment.available_from)
              : null;
            const status =
              availableFrom && now < availableFrom
                ? "Upcoming"
                : now > dueDate
                  ? "Closed"
                  : "Active";

            return (
              <Link
                key={assignment.assignment_id}
                href={`/teacher/assignments/${assignment.assignment_id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs text-gray-500">{assignment.class_name}</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {assignment.title}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Due Date: {new Date(assignment.due_date).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    Total Students: {assignment.total_students}
                  </span>
                  <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">
                    Submitted: {assignment.submitted_count}
                  </span>
                  <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    Graded: {assignment.graded_count}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      status === "Active"
                        ? "bg-green-100 text-green-700"
                        : status === "Closed"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
