"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { DataTable } from "@/components/super-admin/data-table";
import { ConfirmActionButton } from "@/components/super-admin/confirm-action-button";

type SchoolOption = {
  school_id: string;
  name: string;
};

type AdminItem = {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  school_id: string | null;
  created_at: string;
  school?: SchoolOption | null;
};

type AdminFormState = {
  user_id?: string;
  name: string;
  email: string;
  password: string;
  school_id: string;
};

const initialForm: AdminFormState = {
  name: "",
  email: "",
  password: "",
  school_id: "",
};

export function AdminsManager() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<AdminFormState>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const isEditMode = useMemo(() => Boolean(formState.user_id), [formState.user_id]);
  const filteredAdmins = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return admins;
    }
    return admins.filter((admin) => {
      const nameMatch = admin.name.toLowerCase().includes(keyword);
      const emailMatch = admin.email.toLowerCase().includes(keyword);
      return nameMatch || emailMatch;
    });
  }, [admins, searchTerm]);

  async function loadAll() {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      if (selectedSchoolId) {
        params.set("school_id", selectedSchoolId);
      }
      const adminUrl = params.toString() ? `/api/admins?${params.toString()}` : "/api/admins";
      const [adminsResponse, schoolsResponse] = await Promise.all([
        fetch(adminUrl),
        fetch("/api/schools"),
      ]);

      const adminsPayload = (await adminsResponse.json()) as {
        data?: AdminItem[];
        message?: string;
      };
      const schoolsPayload = (await schoolsResponse.json()) as {
        data?: SchoolOption[];
        message?: string;
      };

      if (!adminsResponse.ok) {
        throw new Error(adminsPayload.message || "Failed to load admins");
      }

      if (!schoolsResponse.ok) {
        throw new Error(schoolsPayload.message || "Failed to load schools");
      }

      setAdmins(adminsPayload.data || []);
      setSchools(schoolsPayload.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [selectedSchoolId]);

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
            school_id: formState.school_id,
          }
        : formState;

      const response = await fetch("/api/admins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to save admin");
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
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save admin";
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
    const response = await fetch("/api/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete admin");
    }

    await loadAll();
  }

  async function handleToggleAdmin(admin: AdminItem) {
    const response = await fetch("/api/admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: admin.user_id,
        is_active: !admin.is_active,
      }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Failed to update admin status");
    }
    await loadAll();
  }

  async function handleResetPassword(admin: AdminItem) {
    const response = await fetch("/api/admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: admin.user_id,
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Admins</h3>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:items-center">
          <select
            value={selectedSchoolId}
            onChange={(event) => {
              setSelectedSchoolId(event.target.value);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 sm:w-44"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.school_id} value={school.school_id}>
                {school.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
            }}
            placeholder="Search name/email..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 sm:w-48"
          />
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
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : filteredAdmins}
        mobileCardRender={(row) => (
          <div>
            <p className="text-sm font-semibold text-gray-900 sm:text-base">{row.name}</p>
            <p className="mt-1 break-all text-xs text-gray-500 sm:text-sm">{row.email}</p>
            <p className="mt-2 text-xs text-gray-600 sm:text-sm">
              School: {row.school?.name ?? "-"}
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
                    school_id: row.school_id || "",
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
                  await handleToggleAdmin(row);
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 sm:text-sm"
              >
                {row.is_active ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleResetPassword(row);
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 sm:text-sm"
              >
                Reset Password
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
                      school_id: row.school_id || "",
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
                    await handleToggleAdmin(row);
                  }}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {row.is_active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleResetPassword(row);
                  }}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  Reset Password
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

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                {isEditMode ? "Edit Admin" : "Add Admin"}
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
                <select
                  value={formState.school_id}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, school_id: event.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.school_id} value={school.school_id}>
                      {school.name}
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
