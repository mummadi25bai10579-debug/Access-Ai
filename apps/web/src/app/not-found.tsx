import React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      role="main"
      className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[70vh]"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-muted max-w-md text-sm mb-6">
        The requested resource, pathway, or document could not be located in AccessAI.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
        Return to Dashboard
      </Link>
    </div>
  );
}

