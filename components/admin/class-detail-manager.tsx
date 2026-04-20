"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

type ClassDetail = {
  class_id: string;
  name: string;
  teacher?: {
    user_id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    students: number;
  };
  students?: StudentItem[];
};

type StudentItem = {
  user_id: string;
  name: string;
  email: string;
};

type ClassDetailManagerProps = {
  classId: string;
  initialClassDetail: ClassDetail;
};

export function ClassDetailManager({
  classId,
  initialClassDetail,
}: ClassDetailManagerProps) {
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(initialClassDetail);
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<StudentItem[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<StudentItem[]>([]);
  const [classStudents, setClassStudents] = useState<StudentItem[]>(
    initialClassDetail.students || [],
  );
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [loadingStudentSuggestions, setLoadingStudentSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const availableSuggestions = useMemo(() => {
    const assignedIds = new Set(classStudents.map((student) => student.user_id));
    const selectedIds = new Set(selectedStudents.map((student) => student.user_id));
    return studentSuggestions.filter(
      (student) =>
        !assignedIds.has(student.user_id) && !selectedIds.has(student.user_id),
    );
  }, [studentSuggestions, classStudents, selectedStudents]);

  async function loadClassDetail() {
    const response = await fetch(`/api/classes/${classId}`);
    const payload = (await response.json()) as {
      data?: ClassDetail;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(payload.message || "Failed to load class detail");
    }
    setClassDetail(payload.data || null);
  }

  async function loadClassStudents() {
    const response = await fetch(`/api/classes/${classId}/students`);
    const payload = (await response.json()) as {
      data?: StudentItem[];
      message?: string;
    };
    if (!response.ok) {
      throw new Error(payload.message || "Failed to load class students");
    }
    setClassStudents(payload.data || []);
  }

  async function searchStudents(searchTerm: string) {
    setLoadingStudentSuggestions(true);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "10");
    params.set("search", searchTerm);
    const response = await fetch(`/api/students?${params.toString()}`);
    const payload = (await response.json()) as {
      data?: StudentItem[];
      message?: string;
    };
    if (!response.ok) {
      setLoadingStudentSuggestions(false);
      throw new Error(payload.message || "Failed to load students");
    }
    setStudentSuggestions(payload.data || []);
    setLoadingStudentSuggestions(false);
  }

  async function loadData() {
    setLoading(true);
    setErrorMessage("");
    try {
      await Promise.all([loadClassDetail(), loadClassStudents()]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [classId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedStudentSearch(studentSearchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [studentSearchInput]);

  useEffect(() => {
    if (!debouncedStudentSearch) {
      setStudentSuggestions([]);
      setLoadingStudentSuggestions(false);
      return;
    }

    void searchStudents(debouncedStudentSearch).catch(() => {
      setStudentSuggestions([]);
      setLoadingStudentSuggestions(false);
    });
  }, [debouncedStudentSearch]);

  async function handleAssignStudents() {
    const studentIds = selectedStudents.map((student) => student.user_id);
    if (studentIds.length === 0) {
      return;
    }

    setAssigningStudent(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: studentIds }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to assign student");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Students added successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      setSelectedStudents([]);
      setStudentSearchInput("");
      setStudentSuggestions([]);
      setIsSuggestionOpen(false);
      await Promise.all([loadClassStudents(), loadClassDetail()]);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to assign student",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setAssigningStudent(false);
    }
  }

  async function handleRemoveStudent(student: StudentItem) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove student?",
      text: `Remove ${student.name} from this class?`,
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setRemovingStudentId(student.user_id);
    try {
      const response = await fetch(`/api/classes/${classId}/students/${student.user_id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to remove student");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Student removed successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      await Promise.all([loadClassStudents(), loadClassDetail()]);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to remove student",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setRemovingStudentId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading class detail...</p>;
  }

  if (errorMessage) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {errorMessage}
      </p>
    );
  }

  if (!classDetail) {
    return (
      <p className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
        Class not found.
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <article className="rounded-xl bg-white p-6 shadow-md">
        <Link
          href="/admin/classes"
          className="mb-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Classes
        </Link>
        <h3 className="text-2xl font-semibold text-gray-900">{classDetail.name}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Teacher</p>
            <p className="text-sm font-medium text-gray-900">
              {classDetail.teacher?.name || "No Teacher"}
            </p>
            {classDetail.teacher?.email ? (
              <p className="text-xs text-gray-500">{classDetail.teacher.email}</p>
            ) : null}
            {!classDetail.teacher ? (
              <p className="mt-1 inline-flex rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                Warning: No Teacher Assigned
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Students</p>
            <p className="text-sm font-medium text-gray-900">
              {classDetail._count?.students ?? classStudents.length}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <h4 className="text-lg font-semibold text-gray-900">Add Student</h4>
        <p className="mt-1 text-xs text-gray-500">
          Search by name/email. Students already in class are automatically excluded.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full">
            <input
              type="text"
              value={studentSearchInput}
              onChange={(event) => {
                setStudentSearchInput(event.target.value);
                setIsSuggestionOpen(true);
              }}
              onFocus={() => {
                if (studentSearchInput.trim()) {
                  setIsSuggestionOpen(true);
                }
              }}
              placeholder="Search student by name or email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
              disabled={assigningStudent}
            />
            {isSuggestionOpen && studentSearchInput.trim() ? (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md">
                {loadingStudentSuggestions ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Loading...</p>
                ) : availableSuggestions.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">No students found</p>
                ) : (
                  availableSuggestions.map((student) => (
                    <button
                      key={student.user_id}
                      type="button"
                      onClick={() => {
                        setSelectedStudents((prev) => [...prev, student]);
                        setStudentSearchInput("");
                        setStudentSuggestions([]);
                        setIsSuggestionOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left transition hover:bg-blue-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </button>
                  ))
                )}
              </div>
            ) : null}
            {selectedStudents.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <span
                    key={student.user_id}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                  >
                    {student.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudents((prev) =>
                          prev.filter((item) => item.user_id !== student.user_id),
                        );
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Remove ${student.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              void handleAssignStudents();
            }}
            disabled={assigningStudent || selectedStudents.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {assigningStudent ? "Adding..." : "Add Students"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentSearchInput("");
              setDebouncedStudentSearch("");
              setStudentSuggestions([]);
              setSelectedStudents([]);
              setIsSuggestionOpen(false);
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Data
          </button>
        </div>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <h4 className="text-lg font-semibold text-gray-900">Students List</h4>
        <div className="mt-3 space-y-2">
          {classStudents.length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            classStudents.map((student) => (
              <div
                key={student.user_id}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleRemoveStudent(student);
                  }}
                  disabled={removingStudentId === student.user_id}
                  className="w-full rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60 sm:w-auto"
                >
                  {removingStudentId === student.user_id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
