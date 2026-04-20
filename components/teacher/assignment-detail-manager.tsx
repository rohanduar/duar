"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";

type StudentItem = {
  user_id: string;
  name: string;
  email: string;
};

type SubmissionItem = {
  submission_id: string;
  student_id: string;
  submitted_at: string;
  answer_text?: string | null;
  file_url?: string | null;
  score: number | null;
  feedback: string | null;
  student: {
    user_id: string;
    name: string;
    email: string;
  };
};

type AssignmentDetail = {
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
  class_name: string;
  students: StudentItem[];
  submissions: SubmissionItem[];
};

type AssignmentDetailManagerProps = {
  assignment: AssignmentDetail;
};

const SUBMISSIONS_PAGE_SIZE = 10;

function formatReadableDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date
    .toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", " -");
}

export function AssignmentDetailManager({ assignment }: AssignmentDetailManagerProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(assignment.submissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [submissionDrafts, setSubmissionDrafts] = useState<
    Record<string, { score: string; feedback: string }>
  >(() =>
    assignment.submissions.reduce<Record<string, { score: string; feedback: string }>>(
      (acc, submission) => {
        acc[submission.submission_id] = {
          score: submission.score === null ? "" : String(submission.score),
          feedback: submission.feedback || "",
        };
        return acc;
      },
      {},
    ),
  );

  async function handleSaveSubmission(submission: SubmissionItem) {
    setSavingSubmissionId(submission.submission_id);
    try {
      const draft = submissionDrafts[submission.submission_id] || {
        score: "",
        feedback: "",
      };
      const requestBody = {
        score: draft.score === "" ? null : Number(draft.score),
        feedback: draft.feedback || null,
      };

      if (draft.score === "") {
        throw new Error("Score is required");
      }

      const numericScore = Number(draft.score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error("Score must be between 0 and 100");
      }

      const response = await fetch(`/api/teacher/submissions/${submission.submission_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = (await response.json()) as {
        data?: {
          submission_id: string;
          score: number | null;
          feedback: string | null;
        };
        message?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.message || "Failed to update submission");
      }

      setSubmissions((prev) =>
        prev.map((item) =>
          item.submission_id === result.data!.submission_id
            ? { ...item, score: result.data!.score, feedback: result.data!.feedback }
            : item,
        ),
      );
      setSubmissionDrafts((prev) => ({
        ...prev,
        [submission.submission_id]: {
          score: result.data!.score === null ? "" : String(result.data!.score),
          feedback: result.data!.feedback || "",
        },
      }));

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Submission updated successfully",
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
      });
      return true;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to update submission",
        confirmButtonColor: "#dc2626",
      });
      return false;
    } finally {
      setSavingSubmissionId(null);
    }
  }

  const keyword = search.trim().toLowerCase();
  const submissionRows = useMemo(() => {
    const submissionByStudent = new Map<string, SubmissionItem>();
    submissions.forEach((submission) => {
      submissionByStudent.set(submission.student.user_id, submission);
    });

    const dueDate = new Date(assignment.due_date);
    return assignment.students.map((student) => {
      const submission = submissionByStudent.get(student.user_id) || null;
      const isLate = submission ? new Date(submission.submitted_at) > dueDate : false;
      const status = submission ? (isLate ? "Late" : "Submitted") : "Not Submitted";
      return {
        student,
        submission,
        status,
      };
    });
  }, [assignment.due_date, assignment.students, submissions]);

  const totalStudents = assignment.students.length;
  const submittedCount = submissionRows.filter((row) => row.submission).length;
  const notSubmittedCount = totalStudents - submittedCount;
  const gradedCount = submissionRows.filter(
    (row) => row.submission && row.submission.score !== null,
  ).length;

  const filteredRows = keyword
    ? submissionRows.filter((row) => row.student.name.toLowerCase().includes(keyword))
    : submissionRows;
  const statusFilteredRows = filteredRows.filter((row) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "submitted") return row.status === "Submitted" || row.status === "Late";
    if (statusFilter === "not_submitted") return row.status === "Not Submitted";
    if (statusFilter === "ungraded")
      return Boolean(row.submission) && row.submission?.score === null;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(statusFilteredRows.length / SUBMISSIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * SUBMISSIONS_PAGE_SIZE;
  const paginatedRows = statusFilteredRows.slice(start, start + SUBMISSIONS_PAGE_SIZE);

  const gradingSubmission = gradingSubmissionId
    ? submissions.find((submission) => submission.submission_id === gradingSubmissionId) || null
    : null;
  const gradingDraft = gradingSubmission
    ? submissionDrafts[gradingSubmission.submission_id] || {
        score: gradingSubmission.score === null ? "" : String(gradingSubmission.score),
        feedback: gradingSubmission.feedback || "",
      }
    : null;
  const detailRow = detailStudentId
    ? submissionRows.find((row) => row.student.user_id === detailStudentId) || null
    : null;

  return (
    <section className="space-y-5">
      <article className="rounded-xl bg-white p-6 shadow-md">
        <Link
          href={`/teacher/classes/${assignment.class_id}`}
          className="mb-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Class
        </Link>
        <p className="text-xs uppercase tracking-wide text-gray-500">{assignment.class_name}</p>
        <h3 className="mt-1 text-2xl font-semibold text-gray-900">{assignment.title}</h3>
        <p className="mt-2 text-sm text-gray-700">{assignment.description}</p>
        {assignment.material_link ? (
          <p className="mt-2 text-xs text-blue-700">
            Material:{" "}
            <a
              href={assignment.material_link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800"
            >
              Open Material
            </a>
          </p>
        ) : null}
        {assignment.file_url ? (
          <p className="mt-2 text-xs text-blue-700">
            File:{" "}
            <a
              href={assignment.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800"
              download
            >
              Download File
            </a>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gray-500">
          Created At: {formatReadableDateTime(assignment.created_at)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Due Date: {formatReadableDateTime(assignment.due_date)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Available From: {formatReadableDateTime(assignment.available_from)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Available Until: {formatReadableDateTime(assignment.available_until)}
        </p>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-lg font-semibold text-gray-900">Submissions</h4>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="not_submitted">Not Submitted</option>
              <option value="ungraded">Ungraded</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search student"
              className="w-52 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
            Total Students: {totalStudents}
          </span>
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">
            Submitted: {submittedCount}
          </span>
          <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            Not Submitted: {notSubmittedCount}
          </span>
          <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
            Graded: {gradedCount}
          </span>
          <span className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">
            Ungraded: {submittedCount - gradedCount}
          </span>
        </div>

        <div className="mt-3 space-y-3 md:hidden">
          {paginatedRows.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
              No data available
            </div>
          ) : (
            paginatedRows.map((row) => (
              <div
                key={row.student.user_id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-900">{row.student.name}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Submitted At:{" "}
                  {row.submission
                    ? formatReadableDateTime(row.submission.submitted_at)
                    : "-"}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Score: {row.submission?.score ?? "-"}
                </p>
                <div className="mt-2">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      row.status === "Late"
                        ? "bg-red-100 text-red-700"
                        : row.status === "Submitted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailStudentId(row.student.user_id);
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!row.submission) {
                          return;
                        }
                        setGradingSubmissionId(row.submission.submission_id);
                        setSubmissionDrafts((prev) => ({
                          ...prev,
                          [row.submission.submission_id]: prev[row.submission.submission_id] || {
                            score:
                              row.submission.score === null
                                ? ""
                                : String(row.submission.score),
                            feedback: row.submission.feedback || "",
                          },
                        }));
                      }}
                      disabled={!row.submission}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Grade
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 hidden overflow-x-auto rounded-md border border-gray-200 bg-white md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold uppercase">Student Name</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase">Submitted At</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase">Score</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase">Status</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-400">
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.student.user_id} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-sm text-gray-800">{row.student.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {row.submission
                        ? formatReadableDateTime(row.submission.submitted_at)
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800">
                      {row.submission?.score ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          row.status === "Late"
                            ? "bg-red-100 text-red-700"
                            : row.status === "Submitted"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailStudentId(row.student.user_id);
                          }}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!row.submission) {
                              return;
                            }
                            setGradingSubmissionId(row.submission.submission_id);
                            setSubmissionDrafts((prev) => ({
                              ...prev,
                              [row.submission.submission_id]:
                                prev[row.submission.submission_id] || {
                                  score:
                                    row.submission.score === null
                                      ? ""
                                      : String(row.submission.score),
                                  feedback: row.submission.feedback || "",
                                },
                            }));
                          }}
                          disabled={!row.submission}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Grade
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setPage((prev) => Math.max(1, prev - 1));
            }}
            disabled={safePage === 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              setPage((prev) => Math.min(totalPages, prev + 1));
            }}
            disabled={safePage === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </article>

      {gradingSubmission && gradingDraft ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900">Grade Submission</h4>
              <p className="mt-1 text-sm text-gray-500">{gradingSubmission.student.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                Submitted At: {formatReadableDateTime(gradingSubmission.submitted_at)}
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradingDraft.score}
                  onChange={(event) => {
                    setSubmissionDrafts((prev) => ({
                      ...prev,
                      [gradingSubmission.submission_id]: {
                        score: event.target.value,
                        feedback: gradingDraft.feedback,
                      },
                    }));
                  }}
                  placeholder="Score"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                />
                <textarea
                  value={gradingDraft.feedback}
                  onChange={(event) => {
                    setSubmissionDrafts((prev) => ({
                      ...prev,
                      [gradingSubmission.submission_id]: {
                        score: gradingDraft.score,
                        feedback: event.target.value,
                      },
                    }));
                  }}
                  placeholder="Feedback"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGradingSubmissionId(null);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const isSaved = await handleSaveSubmission(gradingSubmission);
                    if (isSaved) {
                      setGradingSubmissionId(null);
                    }
                  }}
                  disabled={savingSubmissionId === gradingSubmission.submission_id}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingSubmissionId === gradingSubmission.submission_id
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailRow ? (
        <div className="fixed inset-0 z-50 px-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-full items-center justify-center">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900">Detail Submission</h4>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Student Name</p>
                  <p className="font-medium text-gray-900">{detailRow.student.name}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Answer Text</p>
                  <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-800">
                    {detailRow.submission?.answer_text || "No text answer"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">File Submission</p>
                  {detailRow.submission?.file_url ? (
                    <a
                      href={detailRow.submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-blue-700 underline hover:text-blue-800"
                      download
                    >
                      Download Submission
                    </a>
                  ) : (
                    <p className="mt-1 text-gray-500">No file uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Submitted At</p>
                  <p className="mt-1 text-gray-800">
                    {detailRow.submission
                      ? formatReadableDateTime(detailRow.submission.submitted_at)
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                      detailRow.status === "Late"
                        ? "bg-red-100 text-red-700"
                        : detailRow.status === "Submitted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {detailRow.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailStudentId(null);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!detailRow.submission) {
                      return;
                    }
                    setDetailStudentId(null);
                    setGradingSubmissionId(detailRow.submission.submission_id);
                    setSubmissionDrafts((prev) => ({
                      ...prev,
                      [detailRow.submission!.submission_id]:
                        prev[detailRow.submission!.submission_id] || {
                          score:
                            detailRow.submission!.score === null
                              ? ""
                              : String(detailRow.submission!.score),
                          feedback: detailRow.submission!.feedback || "",
                        },
                    }));
                  }}
                  disabled={!detailRow.submission}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
