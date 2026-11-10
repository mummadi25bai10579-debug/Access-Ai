import React from "react";
import { AccessibilityToolbar } from "@/components/accessibility/AccessibilityToolbar";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <header className="bg-card">
        <AccessibilityToolbar />
        <TopNavigation />
      </header>

      <div className="flex-1 flex overflow-hidden bg-background">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background focus:outline-none"
        >
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
