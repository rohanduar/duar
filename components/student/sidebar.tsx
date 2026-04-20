"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { LogOut, LayoutDashboard, BookOpen, UserCircle2 } from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Classes", href: "/student/classes", icon: BookOpen },
  { label: "Account", href: "/student/account", icon: UserCircle2 },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-blue-900 bg-blue-800 px-4 py-6 shadow-md transition-transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 px-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-200/80">
            Workspace
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">Student</h1>
        </div>
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.14em] text-blue-200/70">
          Main Menu
        </p>
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isClassesRoute = item.href === "/student/classes";
            const isActive = isClassesRoute
              ? pathname.startsWith("/student/classes")
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-blue-700 pt-4">
          <ConfirmActionButton
            variant="logout"
            label="Logout"
            onConfirmed={handleLogout}
            className="inline-flex w-full items-center justify-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            icon={<LogOut className="h-4 w-4" />}
          />
        </div>
      </aside>
    </>
  );
}
