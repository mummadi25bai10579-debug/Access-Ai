"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mb-2">
            A
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sign In to AccessAI</h1>
          <p className="text-xs opacity-75">Universal Access & Opportunity Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold block mb-1">Email</label>
            <div className="flex items-center rounded-lg border border-border px-3 bg-background focus-within:ring-2 focus-within:ring-primary">
              <Mail className="w-4 h-4 opacity-50 mr-2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full py-2.5 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Password</label>
            <div className="flex items-center rounded-lg border border-border px-3 bg-background focus-within:ring-2 focus-within:ring-primary">
              <Lock className="w-4 h-4 opacity-50 mr-2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover flex items-center justify-center gap-2 transition-colors focus-visible:ring-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs opacity-80 pt-2 border-t border-border">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
