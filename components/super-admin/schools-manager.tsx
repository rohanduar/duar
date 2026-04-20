"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { DataTable } from "@/components/super-admin/data-table";
import { ConfirmActionButton } from "@/components/super-admin/confirm-action-button";

type SchoolItem = {
  school_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  total_admins: number;
  total_teachers: number;
  total_students: number;
};

type SchoolFormState = {
  school_id?: string;
  name: string;
};

export function SchoolsManager() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<SchoolFormState>({ name: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const isEditMode = useMemo(() => Boolean(formState.school_id), [formState.school_id]);
  const filteredSchools = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return schools;
    }
    return schools.filter((school) => school.name.toLowerCase().includes(keyword));
  }, [schools, searchTerm]);

  async function loadSchools() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/schools");
      const payload = (await response.json()) as {
        data?: SchoolItem[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load schools");
      }

      setSchools(payload.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchools();
  }, []);

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
      const response = await fetch("/api/schools", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to save school");
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
      setFormState({ name: "" });
      await loadSchools();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save school";
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

  async function handleDelete(school_id: string) {
    const response = await fetch("/api/schools", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school_id }),
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message || "Failed to delete school");
    }

    await loadSchools();
  }

  async function handleToggleSchool(school: SchoolItem) {
    const response = await fetch("/api/schools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: school.school_id,
        is_active: !school.is_active,
      }),
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message || "Failed to update school status");
    }
    await loadSchools();
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Schools</h3>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
            }}
            placeholder="Search school..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 sm:w-48"
          />
          <button
            type="button"
            onClick={() => {
              setFormState({ name: "" });
              setIsFormOpen(true);
            }}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : filteredSchools}
        mobileCardRender={(row) => (
          <div>
            <p className="text-base font-semibold text-gray-900">{row.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              Admins: {row.total_admins} | Teachers: {row.total_teachers} | Students:{" "}
              {row.total_students}
            </p>
            <div className="mt-1">
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  row.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {row.is_active ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Created at {new Date(row.created_at).toLocaleDateString()}
            </p>
            <p className="mt-2 text-sm text-gray-600">School record</p>
            <div className="mt-3 flex items-center justify-end gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  setFormState({ school_id: row.school_id, name: row.name });
                  setIsFormOpen(true);
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleToggleSchool(row);
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                {row.is_active ? "Disable" : "Enable"}
              </button>
              <ConfirmActionButton
                variant="delete"
                label="Delete"
                onConfirmed={async () => {
                  await handleDelete(row.school_id);
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
            header: "School Name",
            render: (row) => row.name,
          },
          {
            key: "created_at",
            header: "Created At",
            render: (row) => new Date(row.created_at).toLocaleDateString(),
          },
          {
            key: "stats",
            header: "Stats",
            render: (row) => (
              <span className="text-sm text-gray-700">
                A: {row.total_admins} | T: {row.total_teachers} | S: {row.total_students}
              </span>
            ),
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
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormState({ school_id: row.school_id, name: row.name });
                    setIsFormOpen(true);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleToggleSchool(row);
                  }}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {row.is_active ? "Disable" : "Enable"}
                </button>
                <ConfirmActionButton
                  variant="delete"
                  label="Delete"
                  onConfirmed={async () => {
                    await handleDelete(row.school_id);
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

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                {isEditMode ? "Edit School" : "Add School"}
              </h4>
              <div className="mt-4 space-y-3">
                <input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, name: event.target.value }));
                  }}
                  placeholder="School name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
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
