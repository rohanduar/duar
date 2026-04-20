"use client";

import { useState } from "react";
import { Sidebar } from "@/components/student/sidebar";
import { Topbar } from "@/components/student/topbar";

type DashboardShellProps = {
  title: string;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  userName,
  userEmail,
  children,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
          }}
        />
        <section className="flex-1 lg:ml-64">
          <div className="fixed inset-x-0 top-0 z-20 border-b border-gray-200 bg-white px-4 md:px-6 lg:left-64">
            <div className="mx-auto w-full max-w-7xl">
              <Topbar
                title={title}
                userName={userName}
                userEmail={userEmail}
                onToggleSidebar={() => {
                  setIsSidebarOpen((prev) => !prev);
                }}
              />
            </div>
          </div>
          <div className="px-6 py-6 pt-24">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
