import React from "react";
import { AccessibilityToolbar } from "@/components/accessibility/AccessibilityToolbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header>
        <AccessibilityToolbar />
      </header>
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-6 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
