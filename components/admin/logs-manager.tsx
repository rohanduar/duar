"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/data-table";

type LogItem = {
  log_id: string;
  user_name: string;
  role: string;
  action: string;
  description: string;
  created_at: string;
};

export function AdminLogsManager() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  function getActionCategory(action: string) {
    if (action === "login" || action.startsWith("login")) return "login";
    if (action === "create" || action.startsWith("create")) return "create";
    if (action === "delete" || action.startsWith("delete")) return "delete";
    if (action === "update" || action.startsWith("update")) return "update";
    return "other";
  }

  function actionBadgeClass(action: string) {
    const category = getActionCategory(action);
    if (category === "login") return "bg-blue-100 text-blue-700";
    if (category === "create") return "bg-green-100 text-green-700";
    if (category === "delete") return "bg-red-100 text-red-700";
    if (category === "update") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  }

  async function loadLogs() {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        role: roleFilter,
        action: actionFilter,
        date: dateFilter,
      });
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const response = await fetch(`/api/logs?${params.toString()}`);
      const payload = (await response.json()) as {
        data?: LogItem[];
        message?: string;
        totalPages?: number;
        page?: number;
      };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load activity logs");
      }

      setLogs(payload.data || []);
      setTotalPages(payload.totalPages || 1);
      if (payload.page && payload.page !== page) {
        setPage(payload.page);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load activity logs",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [page, limit, roleFilter, actionFilter, dateFilter, searchTerm]);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Activity Logs</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="delete">Delete</option>
          <option value="update">Update</option>
          <option value="login">Login</option>
        </select>
        <select
          value={dateFilter}
          onChange={(event) => {
            setDateFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="last7days">Last 7 days</option>
        </select>
        <input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search user/description..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <DataTable
        rows={loading ? [] : logs}
        mobileCardRender={(row) => (
          <div>
            <p className="text-sm text-gray-500">
              {new Date(row.created_at).toLocaleString()}
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900">{row.user_name}</p>
            <p className="mt-1">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {row.role}
              </span>
            </p>
            <p className="mt-2">
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${actionBadgeClass(
                  row.action,
                )}`}
              >
                {getActionCategory(row.action)}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-700">{row.description}</p>
          </div>
        )}
        columns={[
          {
            key: "created_at",
            header: "Date",
            render: (row) => new Date(row.created_at).toLocaleString(),
          },
          {
            key: "user",
            header: "User",
            render: (row) => row.user_name,
          },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {row.role}
              </span>
            ),
          },
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${actionBadgeClass(
                  row.action,
                )}`}
              >
                {getActionCategory(row.action)}
              </span>
            ),
          },
          {
            key: "description",
            header: "Description",
            render: (row) => row.description,
          },
        ]}
        emptyText={loading ? "Loading..." : "No data available"}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setPage((prev) => Math.max(1, prev - 1));
          }}
          disabled={page === 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => {
            setPage((prev) => Math.min(totalPages, prev + 1));
          }}
          disabled={page === totalPages}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}
