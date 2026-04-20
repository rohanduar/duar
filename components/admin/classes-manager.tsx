"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";

type TeacherOption = {
  user_id: string;
  name: string;
  email: string;
};

type ClassItem = {
  class_id: string;
  name: string;
  school_id: string;
  teacher_id: string | null;
  created_at: string;
  teacher?: {
    user_id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    students: number;
    assignments?: number;
  };
};

type ClassFormState = {
  class_id?: string;
  name: string;
  teacher_id: string;
};

const initialForm: ClassFormState = {
  name: "",
  teacher_id: "",
};
const DEFAULT_LIMIT = 10;

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function ClassesManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, Number(searchParams.get("page")) || 1),
  );
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 1,
  });
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<ClassFormState>(initialForm);

  const isEditMode = useMemo(() => Boolean(formState.class_id), [formState.class_id]);
  const totalPages = Math.max(1, meta.totalPages || 1);

  function updateUrl(page: number, search: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("limit", String(DEFAULT_LIMIT));
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function fetchClasses(searchTerm = "", page = 1) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(DEFAULT_LIMIT));
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      const classesResponse = await fetch(`/api/classes?${params.toString()}`);
      const classesPayload = (await classesResponse.json()) as {
        data?: ClassItem[];
        meta?: PaginationMeta;
        message?: string;
      };

      if (!classesResponse.ok) {
        throw new Error(classesPayload.message || "Failed to load classes");
      }

      setClasses(classesPayload.data || []);
      setMeta(
        classesPayload.meta || {
          total: 0,
          page,
          limit: DEFAULT_LIMIT,
          totalPages: 1,
        },
      );
      if (classesPayload.meta?.page && classesPayload.meta.page !== currentPage) {
        setCurrentPage(classesPayload.meta.page);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const teachersResponse = await fetch("/api/teachers");

      const teachersPayload = (await teachersResponse.json()) as {
        data?: TeacherOption[];
        message?: string;
      };

      if (!teachersResponse.ok) {
        throw new Error(teachersPayload.message || "Failed to load teachers");
      }

      setTeachers(teachersPayload.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    const pageFromUrl = Math.max(1, Number(searchParams.get("page")) || 1);
    const searchFromUrl = searchParams.get("search") || "";
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
    if (searchFromUrl !== debouncedSearch) {
      setDebouncedSearch(searchFromUrl);
      setSearchInput(searchFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    updateUrl(currentPage, debouncedSearch);
    void fetchClasses(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (isEditMode) {
      const confirm = await Swal.fire({
        icon: "question",
        title: "Confirm update?",
        text: "Do you want to save these changes?",
        showCancelButton: true,
        confirmButtonText: "Yes, update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
      });

      if (!confirm.isConfirmed) {
        return;
      }
    }

    setSaving(true);

    try {
      const method = isEditMode ? "PUT" : "POST";
      const payload = isEditMode
        ? {
            class_id: formState.class_id,
            name: formState.name,
            teacher_id: formState.teacher_id || null,
          }
        : {
            name: formState.name,
            teacher_id: formState.teacher_id || null,
          };

      const response = await fetch("/api/classes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to save class");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: isEditMode
          ? "Data updated successfully"
          : "Data created successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      setIsFormOpen(false);
      setFormState(initialForm);
      await fetchClasses(debouncedSearch, currentPage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save class";
      setErrorMessage(message);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(class_id: string) {
    const response = await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete class");
    }

    await fetchClasses(debouncedSearch, currentPage);
  }

  async function handleDeleteAction(row: ClassItem) {
    const studentsCount = row._count?.students ?? 0;
    if (studentsCount > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Cannot delete class",
        text: "This class still has students. Remove students first.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete class?",
      text: `Delete ${row.name}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    await handleDelete(row.class_id);
    await Swal.fire({
      title: "Deleted",
      text: `${row.name} deleted successfully.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Classes</h3>
        <button
          type="button"
          onClick={() => {
            setFormState(initialForm);
            setIsFormOpen(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      <input
        type="text"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
        }}
        placeholder="Search by class name or teacher name"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
      />

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : classes}
        mobileCardRender={(row) => (
          <div>
            <Link href={`/admin/classes/${row.class_id}`} className="block">
              <p className="text-base font-semibold text-blue-700 hover:underline">
                {row.name}
              </p>
              <div className="mt-1">
                <p className="text-xs font-semibold text-gray-700">
                  {row.teacher?.name || "No Teacher"}
                </p>
                {row.teacher?.email ? (
                  <p className="text-xs text-gray-500">{row.teacher.email}</p>
                ) : null}
              </div>
              <div className="mt-2">
                {row.teacher ? (
                  <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Teacher Assigned
                  </span>
                ) : (
                  <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Warning: No Teacher
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Students: {row._count?.students ?? 0}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Assignments: {row._count?.assignments ?? 0}
              </p>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/classes/${row.class_id}`}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFormState({
                    class_id: row.class_id,
                    name: row.name,
                    teacher_id: row.teacher_id || "",
                  });
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteAction(row);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
        columns={[
          {
            key: "name",
            header: "Class Name",
            render: (row) => (
              <Link
                href={`/admin/classes/${row.class_id}`}
                className="font-medium text-blue-700 hover:underline"
              >
                {row.name}
              </Link>
            ),
          },
          {
            key: "teacher",
            header: "Teacher",
            render: (row) =>
              row.teacher ? (
                <div>
                  <p className="font-semibold text-gray-900">{row.teacher.name}</p>
                  <p className="text-xs text-gray-500">{row.teacher.email}</p>
                </div>
              ) : (
                <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  No Teacher
                </span>
              ),
          },
          {
            key: "students",
            header: "Students",
            render: (row) => row._count?.students ?? 0,
          },
          {
            key: "assignments",
            header: "Assignments",
            render: (row) => row._count?.assignments ?? 0,
          },
          {
            key: "created_at",
            header: "Created At",
            render: (row) => new Date(row.created_at).toLocaleDateString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex w-full items-center justify-end gap-2 whitespace-nowrap">
                <Link
                  href={`/admin/classes/${row.class_id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setFormState({
                      class_id: row.class_id,
                      name: row.name,
                      teacher_id: row.teacher_id || "",
                    });
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteAction(row);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        emptyText={loading ? "Loading..." : "No data available"}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setCurrentPage((prev) => Math.max(1, prev - 1));
          }}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-xs font-medium text-gray-600">
          Page {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => {
            setCurrentPage((prev) => Math.min(totalPages, prev + 1));
          }}
          disabled={currentPage === totalPages}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Next
        </button>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                {isEditMode ? "Edit Class" : "Add Class"}
              </h4>
              <div className="mt-4 grid gap-3">
                <input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, name: event.target.value }));
                  }}
                  placeholder="Class name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <select
                  value={formState.teacher_id}
                  onChange={(event) => {
                    setFormState((prev) => ({
                      ...prev,
                      teacher_id: event.target.value,
                    }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                >
                  <option value="">Unassigned teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : isEditMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
