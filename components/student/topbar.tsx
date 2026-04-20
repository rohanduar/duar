"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";

type TopbarProps = {
  title: string;
  userName?: string;
  userEmail?: string;
  onToggleSidebar: () => void;
};

export function Topbar({
  title,
  userName,
  userEmail,
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      "/student": "Dashboard",
      "/student/classes": "Classes",
      "/student/account": "Account",
    };

    if (pathname.startsWith("/student/classes/")) {
      return "Class Detail";
    }

    return titleMap[pathname] || title;
  }, [pathname, title]);

  const initials = (userName || "U")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Logout?",
      text: "You need to sign in again to access the dashboard.",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="flex h-16 items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{currentTitle}</h2>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen((prev) => !prev);
          }}
          className="flex items-center gap-3 text-right"
        >
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName || "User"}</p>
            <p className="text-xs text-gray-500">{userEmail || "-"}</p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {initials}
          </div>
        </button>

        {isDropdownOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-md">
            <Link
              href="/student/account"
              onClick={() => {
                setIsDropdownOpen(false);
              }}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Account
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
