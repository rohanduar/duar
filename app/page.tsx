import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Multi-School E-Learning Foundation
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Base setup is ready: Prisma schema, credentials auth, session role, and
          middleware access control.
        </p>

        {session ? (
          <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Name:</span> {session.user.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
            <p>
              <span className="font-medium">Role:</span> {session.user.role}
            </p>
            <p>
              <span className="font-medium">School ID:</span>{" "}
              {session.user.school_id ?? "-"}
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>You are not logged in.</p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
