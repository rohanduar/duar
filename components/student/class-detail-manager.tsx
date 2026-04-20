"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type SubmissionItem = {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  answer_text: string | null;
  file_url: string | null;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
};

type AssignmentItem = {
  assignment_id: string;
  title: string;
  description: string;
  material_link: string | null;
  file_url?: string | null;
  due_date: string;
  available_from?: string | null;
  status: "NOT_AVAILABLE" | "AVAILABLE" | "SUBMITTED" | "GRADED" | "LATE";
  submissions?: SubmissionItem[];
};

type StudentClassDetail = {
  class_id: string;
  class_name: string;
  assignments: AssignmentItem[];
};

type SubmissionDraft = {
  answer_text: string;
  file_url: string;
};

type ClassDetailManagerProps = {
  classDetail: StudentClassDetail;
};

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

export function StudentClassDetailManager({ classDetail }: ClassDetailManagerProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(classDetail.assignments);
  const [openSubmitId, setOpenSubmitId] = useState<string | null>(null);
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(null);
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, SubmissionDraft>>(
    () =>
      classDetail.assignments.reduce<Record<string, SubmissionDraft>>((acc, assignment) => {
        acc[assignment.assignment_id] = {
          answer_text: "",
          file_url: "",
        };
        return acc;
      }, {}),
  );

  async function handleSubmitAssignment(assignment: AssignmentItem) {
    const draft = submissionDrafts[assignment.assignment_id] || {
      answer_text: "",
      file_url: "",
    };

    setSavingAssignmentId(assignment.assignment_id);
    try {
      const response = await fetch("/api/student/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignment.assignment_id,
          answer_text: draft.answer_text || null,
          file_url: draft.file_url || null,
        }),
      });

      const result = (await response.json()) as {
        data?: SubmissionItem;
        message?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.message || "Failed to submit assignment");
      }

      setAssignments((prev) =>
        prev.map((item) =>
          item.assignment_id === assignment.assignment_id
            ? {
                ...item,
                submissions: [result.data!],
              }
            : item,
        ),
      );
      setOpenSubmitId(null);
      setSubmissionDrafts((prev) => ({
        ...prev,
        [assignment.assignment_id]: { answer_text: "", file_url: "" },
      }));

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Assignment submitted",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to submit assignment",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSavingAssignmentId(null);
    }
  }

  return (
    <section className="space-y-5">
      <article className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="text-2xl font-semibold text-gray-900">{classDetail.class_name}</h3>
      </article>

      <article className="rounded-xl bg-white p-6 shadow-md">
        <h4 className="text-lg font-semibold text-gray-900">Assignments</h4>
        <div className="mt-4 space-y-3">
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            assignments.map((assignment) => {
              const submission = assignment.submissions?.[0];
              const isSubmitted = Boolean(submission);
              const now = new Date();
              const dueDate = new Date(assignment.due_date);
              const isSubmissionClosed = now > dueDate || assignment.status === "NOT_AVAILABLE";
              const draft = submissionDrafts[assignment.assignment_id] || {
                answer_text: "",
                file_url: "",
              };
              const statusLabel = assignment.status;
              const statusText =
                statusLabel === "NOT_AVAILABLE"
                  ? "Not Available"
                  : statusLabel === "AVAILABLE"
                    ? "Available"
                    : statusLabel === "SUBMITTED"
                      ? "Submitted"
                      : statusLabel === "GRADED"
                        ? "Graded"
                        : "Late";
              const statusClass =
                assignment.status === "NOT_AVAILABLE"
                  ? "bg-gray-100 text-gray-700"
                  : assignment.status === "AVAILABLE"
                    ? "bg-blue-100 text-blue-700"
                    : assignment.status === "SUBMITTED"
                      ? "bg-yellow-100 text-yellow-700"
                      : assignment.status === "GRADED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700";

              return (
                <div
                  key={assignment.assignment_id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                  <p className="mt-1 text-sm text-gray-700">{assignment.description}</p>
                  {assignment.material_link ? (
                    <p className="mt-1 text-xs text-blue-700">
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
                    <p className="mt-1 text-xs text-blue-700">
                      File:{" "}
                      <a
                        href={assignment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-800"
                        download
                      >
                        Download Material
                      </a>
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-gray-500">
                    Due Date: {new Date(assignment.due_date).toLocaleString()}
                  </p>
                  <div className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                    {statusText}
                  </div>

                  {isSubmitted ? (
                    <div className="mt-3 space-y-1 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">
                      <p className="font-medium">Submitted</p>
                      {submission?.score !== null && submission?.score !== undefined ? (
                        <p>Score: {submission.score}</p>
                      ) : null}
                      {submission?.feedback ? <p>Feedback: {submission.feedback}</p> : null}
                      <button
                        type="button"
                        disabled
                        className="mt-2 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
                      >
                        Already Submitted
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenSubmitId((prev) =>
                            prev === assignment.assignment_id ? null : assignment.assignment_id,
                          );
                        }}
                        disabled={isSubmissionClosed}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Submit
                      </button>
                      {isSubmissionClosed ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {assignment.status === "NOT_AVAILABLE"
                            ? "Assignment not available yet"
                            : "Submission closed"}
                        </p>
                      ) : null}

                      {openSubmitId === assignment.assignment_id && !isSubmissionClosed ? (
                        <div className="mt-3 space-y-2 rounded-md border border-gray-200 p-3">
                          <textarea
                            value={draft.answer_text}
                            onChange={(event) => {
                              setSubmissionDrafts((prev) => ({
                                ...prev,
                                [assignment.assignment_id]: {
                                  answer_text: event.target.value,
                                  file_url: draft.file_url,
                                },
                              }));
                            }}
                            rows={3}
                            placeholder="Your answer"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                          />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }
                              void readFileAsDataUrl(file).then((dataUrl) => {
                                setSubmissionDrafts((prev) => ({
                                  ...prev,
                                  [assignment.assignment_id]: {
                                    answer_text: draft.answer_text,
                                    file_url: dataUrl,
                                  },
                                }));
                              });
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                          />
                          {draft.file_url ? (
                            <p className="text-xs text-green-700">File selected and ready to submit</p>
                          ) : null}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                void handleSubmitAssignment(assignment);
                              }}
                              disabled={savingAssignmentId === assignment.assignment_id}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingAssignmentId === assignment.assignment_id
                                ? "Submitting..."
                                : "Submit"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </article>
    </section>
  );
}
