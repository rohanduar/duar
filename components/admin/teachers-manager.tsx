"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";

type TeacherItem = {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  school_id: string | null;
  created_at: string;
  _count?: {
    taught_classes: number;
  };
  school?: {
    school_id: string;
    name: string;
  } | null;
};

type TeacherFormState = {
  user_id?: string;
  name: string;
  email: string;
  password: string;
};

const initialForm: TeacherFormState = {
  name: "",
  email: "",
  password: "",
};
const DEFAULT_LIMIT = 10;

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function TeachersManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<TeacherFormState>(initialForm);

  const isEditMode = useMemo(() => Boolean(formState.user_id), [formState.user_id]);
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

  async function loadTeachers(searchTerm = "", page = 1) {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(DEFAULT_LIMIT));
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const response = await fetch(`/api/teachers?${params.toString()}`);
      const payload = (await response.json()) as {
        data?: TeacherItem[];
        meta?: PaginationMeta;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load teachers");
      }

      setTeachers(payload.data || []);
      setMeta(
        payload.meta || {
          total: 0,
          page,
          limit: DEFAULT_LIMIT,
          totalPages: 1,
        },
      );
      if (payload.meta?.page && payload.meta.page !== currentPage) {
        setCurrentPage(payload.meta.page);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load teachers",
      );
    } finally {
      setLoading(false);
    }
  }

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
    void loadTeachers(debouncedSearch, currentPage);
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
            user_id: formState.user_id,
            name: formState.name,
            email: formState.email,
            password: formState.password,
          }
        : formState;

      const response = await fetch("/api/teachers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to save teacher");
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
      await loadTeachers(debouncedSearch, currentPage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save teacher";
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

  async function handleDelete(user_id: string) {
    const response = await fetch("/api/teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete teacher");
    }

    await loadTeachers(debouncedSearch, currentPage);
  }

  async function handleToggleTeacher(row: TeacherItem) {
    const response = await fetch("/api/teachers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: row.user_id,
        is_active: !row.is_active,
      }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Failed to update teacher status");
    }

    await loadTeachers(debouncedSearch, currentPage);
  }

  async function handleResetPassword(row: TeacherItem) {
    const response = await fetch("/api/teachers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: row.user_id,
        reset_password: true,
      }),
    });

    const data = (await response.json()) as {
      message?: string;
      temporary_password?: string;
    };

    if (!response.ok) {
      throw new Error(data.message || "Failed to reset password");
    }

    await Swal.fire({
      icon: "success",
      title: "Password Reset",
      text: `Temporary password: ${data.temporary_password || "-"}`,
      confirmButtonColor: "#2563eb",
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Teachers</h3>
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
        placeholder="Search by name or email"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
      />

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : teachers}
        mobileCardRender={(row) => (
          <div>
            <p className="text-base font-semibold text-gray-900">{row.name}</p>
            <p className="mt-1 break-all text-xs text-gray-500">{row.email}</p>
            <p className="mt-2 text-sm text-gray-600">
              School: {row.school?.name ?? "-"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total Classes: {row._count?.taught_classes ?? 0}
            </p>
            <div className="mt-2">
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  row.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {row.is_active ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormState({
                    user_id: row.user_id,
                    name: row.name,
                    email: row.email,
                    password: "",
                  });
                  setIsFormOpen(true);
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleToggleTeacher(row);
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 sm:text-sm"
              >
                {row.is_active ? "Disable" : "Enable"}
              </button>
              <ConfirmActionButton
                variant="delete"
                label="Delete"
                onConfirmed={async () => {
                  await handleDelete(row.user_id);
                  await Swal.fire({
                    title: "Deleted",
                    text: `${row.name} deleted successfully.`,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                    timerProgressBar: true,
                  });
                }}
                className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              />
            </div>
          </div>
        )}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => row.name,
          },
          {
            key: "email",
            header: "Email",
            render: (row) => row.email,
          },
          {
            key: "school",
            header: "School",
            render: (row) => row.school?.name ?? "-",
          },
          {
            key: "classes",
            header: "Total Classes",
            render: (row) => row._count?.taught_classes ?? 0,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  row.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {row.is_active ? "Active" : "Disabled"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setFormState({
                      user_id: row.user_id,
                      name: row.name,
                      email: row.email,
                      password: "",
                    });
                    setIsFormOpen(true);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleToggleTeacher(row);
                  }}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {row.is_active ? "Disable" : "Enable"}
                </button>
                <ConfirmActionButton
                  variant="delete"
                  label="Delete"
                  onConfirmed={async () => {
                    await handleDelete(row.user_id);
                    await Swal.fire({
                      title: "Deleted",
                      text: `${row.name} deleted successfully.`,
                      icon: "success",
                      timer: 1500,
                      showConfirmButton: false,
                      timerProgressBar: true,
                    });
                  }}
                  className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                />
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
                {isEditMode ? "Edit Teacher" : "Add Teacher"}
              </h4>
              <div className="mt-4 grid gap-3">
                <input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, name: event.target.value }));
                  }}
                  placeholder="Name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <input
                  value={formState.email}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, email: event.target.value }));
                  }}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <input
                  value={formState.password}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, password: event.target.value }));
                  }}
                  placeholder={
                    isEditMode
                      ? "Password (leave blank to keep current)"
                      : "Password"
                  }
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required={!isEditMode}
                />
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
