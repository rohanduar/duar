"use client";

import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import { signOut, useSession } from "next-auth/react";

type AccountFormState = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const initialFormState: AccountFormState = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export function AccountManager() {
  const { data: session } = useSession();
  const [formState, setFormState] = useState<AccountFormState>(initialFormState);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to update password");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password updated successfully",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      setFormState(initialFormState);
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to update password",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-xl space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        <div className="mt-4 space-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Email
            </p>
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.email || "-"}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-md"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Password</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update your password to keep your account secure.
          </p>
        </div>
        <div>
          <label
            htmlFor="current_password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Current Password
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            value={formState.current_password}
            onChange={(event) => {
              setFormState((prev) => ({
                ...prev,
                current_password: event.target.value,
              }));
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="new_password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            value={formState.new_password}
            onChange={(event) => {
              setFormState((prev) => ({
                ...prev,
                new_password: event.target.value,
              }));
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="confirm_password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            value={formState.confirm_password}
            onChange={(event) => {
              setFormState((prev) => ({
                ...prev,
                confirm_password: event.target.value,
              }));
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
