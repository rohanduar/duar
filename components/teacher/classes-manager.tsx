"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";

type TeacherClassItem = {
  class_id: string;
  class_name: string;
  created_at: string;
  _count: {
    students: number;
    assignments: number;
  };
};

export function TeacherClassesManager() {
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadClasses() {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch("/api/teacher/classes");
        const payload = (await response.json()) as {
          data?: TeacherClassItem[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load classes");
        }

        setClasses(payload.data || []);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load classes");
      } finally {
        setLoading(false);
      }
    }

    void loadClasses();
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Classes</h3>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : classes}
        mobileCardRender={(row) => (
          <Link href={`/teacher/classes/${row.class_id}`} className="block">
            <p className="text-base font-semibold text-blue-700 hover:underline">
              {row.class_name}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total Students: {row._count.students}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total Assignments: {row._count.assignments}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Created: {new Date(row.created_at).toLocaleDateString()}
            </p>
          </Link>
        )}
        columns={[
          {
            key: "class_name",
            header: "Class Name",
            render: (row) => (
              <Link
                href={`/teacher/classes/${row.class_id}`}
                className="font-medium text-blue-700 hover:underline"
              >
                {row.class_name}
              </Link>
            ),
          },
          {
            key: "students",
            header: "Total Students",
            render: (row) => row._count.students,
          },
          {
            key: "assignments",
            header: "Total Assignments",
            render: (row) => row._count.assignments,
          },
          {
            key: "created_at",
            header: "Created At",
            render: (row) => new Date(row.created_at).toLocaleDateString(),
          },
        ]}
        emptyText={loading ? "Loading..." : "No data available"}
      />
    </section>
  );
}
