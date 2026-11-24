"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Palette, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: demoEmail,
      password: "password123",
      redirect: false,
    });

    if (res?.error) {
      setError("Demo login failed");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-sm">
      {error && (
        <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Logins for Multi-Tab Reviewers */}
      <div className="mt-6 pt-6 border-t border-neutral-800">
        <p className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          1-Click Demo Accounts (ideal for multi-tab testing):
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("alice@example.com")}
            className="p-2 text-xs font-medium rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-rose-400 hover:border-rose-500/40 transition-all text-center"
          >
            Alice (Owner)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("bob@example.com")}
            className="p-2 text-xs font-medium rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-sky-400 hover:border-sky-500/40 transition-all text-center"
          >
            Bob (Editor)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("charlie@example.com")}
            className="p-2 text-xs font-medium rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-emerald-400 hover:border-emerald-500/40 transition-all text-center"
          >
            Charlie (Viewer)
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CollabBoard</h1>
        </div>
        <h2 className="mt-4 text-center text-xl font-medium text-neutral-300">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-sm text-neutral-500">
          Real-time collaborative whiteboard with CRDT sync
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="p-8 text-center text-neutral-500 text-xs">
              Loading sign-in...
            </div>
          }
        >
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
