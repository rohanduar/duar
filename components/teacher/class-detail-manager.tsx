"use client";

import Link from "next/link";
import { useState } from "react";
import Swal from "sweetalert2";
import { ChevronDown, ChevronRight } from "lucide-react";

type StudentItem = {
  user_id: string;
  name: string;
  email: string;
};

type AssignmentItem = {
  assignment_id: string;
  class_id: string;
  title: string;
  description: string;
  material_link: string | null;
  file_url: string | null;
  due_date: string;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  submissions?: {
    submitted_at: string;
    score: number | null;
  }[];
};

type ClassDetail = {
  class_id: string;
  class_name: string;
  total_students: number;
  students: StudentItem[];
  assignments: AssignmentItem[];
};

type AssignmentFormState = {
  title: string;
  description: string;
  material_link: string;
  file_url: string;
  due_date: string;
  available_from: string;
  available_until: string;
};

const initialAssignmentForm: AssignmentFormState = {
  title: "",
  description: "",
  material_link: "",
  file_url: "",
  due_date: "",
  available_from: "",
  available_until: "",
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

type ClassDetailManagerProps = {
  classDetail: ClassDetail;
};

export function TeacherClassDetailManager({ classDetail }: ClassDetailManagerProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(
    classDetail.assignments,
  );
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formState, setFormState] = useState<AssignmentFormState>(
    initialAssignmentForm,
  );
  const [editFormState, setEditFormState] = useState<AssignmentFormState>(
    initialAssignmentForm,
  );

  async function handleCreateAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const confirm = await Swal.fire({
      icon: "question",
      title: "Create assignment?",
      text: "Make sure the assignment details are correct.",
      showCancelButton: true,
      confirmButtonText: "Yes, create",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      const requestBody = {
        class_id: classDetail.class_id,
        title: formState.title,
        description: formState.description,
        material_link: formState.material_link || null,
        file_url: formState.file_url || null,
        due_date: new Date(formState.due_date).toISOString(),
        available_from: formState.available_from
          ? new Date(formState.available_from).toISOString()
          : null,
        available_until: formState.available_until
          ? new Date(formState.available_until).toISOString()
          : null,
      };

      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = (await response.json()) as {
        data?: AssignmentItem;
        message?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Failed to create assignment");
      }

      setAssignments((prev) => [result.data as AssignmentItem, ...prev]);
      setIsCreateOpen(false);
      setFormState(initialAssignmentForm);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Assignment created successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create assignment";
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

  async function handleEditAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAssignmentId) {
      return;
    }

    setSaving(true);
    try {
      const requestBody = {
        title: editFormState.title,
        description: editFormState.description,
        material_link: editFormState.material_link || null,
        file_url: editFormState.file_url || null,
        due_date: new Date(editFormState.due_date).toISOString(),
        available_from: editFormState.available_from
          ? new Date(editFormState.available_from).toISOString()
          : null,
        available_until: editFormState.available_until
          ? new Date(editFormState.available_until).toISOString()
          : null,
      };

      const response = await fetch(`/api/teacher/assignments/${editingAssignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = (await response.json()) as {
        data?: AssignmentItem;
        message?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Failed to update assignment");
      }

      setAssignments((prev) =>
        prev.map((item) =>
          item.assignment_id === result.data!.assignment_id ? result.data! : item,
        ),
      );
      setIsEditOpen(false);
      setEditingAssignmentId(null);
      setEditFormState(initialAssignmentForm);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Assignment updated successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update assignment";
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

  async function handleDeleteAssignment(assignment: AssignmentItem) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete assignment?",
      text: `Delete ${assignment.title}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/teacher/assignments/${assignment.assignment_id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete assignment");
      }

      setAssignments((prev) =>
        prev.filter((item) => item.assignment_id !== assignment.assignment_id),
      );

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Assignment deleted successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete assignment";
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

  return (
    <section className="space-y-5">
      <article className="rounded-xl bg-white p-6 shadow-md">
        <Link
          href="/teacher/classes"
          className="mb-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Classes
        </Link>
        <h3 className="text-2xl font-semibold text-gray-900">{classDetail.class_name}</h3>
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Students</p>
          <p className="text-sm font-medium text-gray-900">{classDetail.total_students}</p>
        </div>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <button
          type="button"
          onClick={() => {
            setIsStudentsOpen((prev) => !prev);
          }}
          className="flex w-full cursor-pointer items-center justify-between"
        >
          <h4 className="text-lg font-semibold text-gray-900">
            Students List ({classDetail.students.length})
          </h4>
          {isStudentsOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isStudentsOpen ? "mt-4 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2">
            {classDetail.students.length === 0 ? (
              <p className="text-sm text-gray-400">No students in this class</p>
            ) : (
              classDetail.students.map((student) => (
                <div
                  key={student.user_id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <button
          type="button"
          onClick={() => {
            setIsAssignmentsOpen((prev) => !prev);
          }}
          className="flex w-full cursor-pointer items-center justify-between"
        >
          <h4 className="text-lg font-semibold text-gray-900">
            Assignments ({assignments.length})
          </h4>
          {isAssignmentsOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {errorMessage ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isAssignmentsOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 overflow-visible pb-2">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(true);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Create Assignment
                </button>
              </div>
              {assignments.length === 0 ? (
                <p className="text-sm text-gray-400">No assignments yet</p>
              ) : (
                assignments.map((assignment) => {
                  const submissions = assignment.submissions ?? [];
                  const totalSubmissions = submissions.length;
                  const gradedCount = submissions.filter(
                    (submission) => submission.score !== null,
                  ).length;
                  const dueDate = new Date(assignment.due_date);
                  const now = new Date();
                  const availableFrom = assignment.available_from
                    ? new Date(assignment.available_from)
                    : null;
                  const assignmentStatus =
                    availableFrom && now < availableFrom
                      ? "Upcoming"
                      : now > dueDate
                        ? "Closed"
                        : "Active";
                  const lateCount = submissions.filter((submission) => {
                    const submittedAt = new Date(submission.submitted_at);
                    return submittedAt > dueDate;
                  }).length;

                  return (
                    <div
                      key={assignment.assignment_id}
                      className="mb-4 min-h-fit rounded-lg border border-gray-200 p-5"
                    >
                      <Link
                        href={`/teacher/assignments/${assignment.assignment_id}`}
                        className="block cursor-pointer"
                      >
                        <p className="text-base font-semibold text-gray-900">{assignment.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                          {assignment.description}
                        </p>
                        {assignment.file_url ? (
                          <p className="mt-1 text-xs text-blue-700">File: Download available</p>
                        ) : null}
                        <p className="mt-2 text-xs text-gray-500">
                          Due Date: {new Date(assignment.due_date).toLocaleString()}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            Total Students: {classDetail.total_students}
                          </span>
                          <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">
                            Submitted: {totalSubmissions}
                          </span>
                          <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
                            Graded: {gradedCount}
                          </span>
                          <span className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">
                            Late: {lateCount}
                          </span>
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-medium ${
                              assignmentStatus === "Active"
                                ? "bg-green-100 text-green-700"
                                : assignmentStatus === "Closed"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {assignmentStatus}
                          </span>
                        </div>
                      </Link>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingAssignmentId(assignment.assignment_id);
                            setEditFormState({
                              title: assignment.title,
                              description: assignment.description,
                              material_link: assignment.material_link || "",
                              file_url: assignment.file_url || "",
                              due_date: toDateTimeLocal(assignment.due_date),
                              available_from: toDateTimeLocal(assignment.available_from),
                              available_until: toDateTimeLocal(assignment.available_until),
                            });
                            setIsEditOpen(true);
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteAssignment(assignment);
                          }}
                          className="rounded-md bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </article>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <form
              onSubmit={handleCreateAssignment}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
            >
              <h4 className="text-lg font-semibold text-gray-900">Create Assignment</h4>
              <div className="mt-4 grid gap-3">
                <input
                  value={formState.title}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, title: event.target.value }));
                  }}
                  placeholder="Title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <textarea
                  value={formState.description}
                  onChange={(event) => {
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Description"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Material Link (optional)
                  </label>
                  <input
                    value={formState.material_link}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        material_link: event.target.value,
                      }));
                    }}
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Upload File (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      void readFileAsDataUrl(file).then((dataUrl) => {
                        setFormState((prev) => ({
                          ...prev,
                          file_url: dataUrl,
                        }));
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    value={formState.due_date}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        due_date: event.target.value,
                      }));
                    }}
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Available From
                  </label>
                  <input
                    value={formState.available_from}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        available_from: event.target.value,
                      }));
                    }}
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Available Until
                  </label>
                  <input
                    value={formState.available_until}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        available_until: event.target.value,
                      }));
                    }}
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormState(initialAssignmentForm);
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
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <form
              onSubmit={handleEditAssignment}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
            >
              <h4 className="text-lg font-semibold text-gray-900">Edit Assignment</h4>
              <div className="mt-4 grid gap-3">
                <input
                  value={editFormState.title}
                  onChange={(event) => {
                    setEditFormState((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }));
                  }}
                  placeholder="Title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <textarea
                  value={editFormState.description}
                  onChange={(event) => {
                    setEditFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Description"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Material Link (optional)
                  </label>
                  <input
                    value={editFormState.material_link}
                    onChange={(event) => {
                      setEditFormState((prev) => ({
                        ...prev,
                        material_link: event.target.value,
                      }));
                    }}
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Upload File (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      void readFileAsDataUrl(file).then((dataUrl) => {
                        setEditFormState((prev) => ({
                          ...prev,
                          file_url: dataUrl,
                        }));
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  />
                </div>
                <input
                  value={editFormState.due_date}
                  onChange={(event) => {
                    setEditFormState((prev) => ({
                      ...prev,
                      due_date: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <input
                  value={editFormState.available_from}
                  onChange={(event) => {
                    setEditFormState((prev) => ({
                      ...prev,
                      available_from: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                />
                <input
                  value={editFormState.available_until}
                  onChange={(event) => {
                    setEditFormState((prev) => ({
                      ...prev,
                      available_until: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingAssignmentId(null);
                    setEditFormState(initialAssignmentForm);
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
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
