import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 group mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            A
          </div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">
            AccessAI
          </span>
        </Link>
        <Suspense fallback={<div className="text-muted text-sm animate-pulse">Loading secure sign-in...</div>}>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            forceRedirectUrl="/dashboard"
          />
        </Suspense>
      </div>
    </div>
  );
}

