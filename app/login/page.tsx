"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const redirect = searchParams.get("redirect") || "/";
        router.push(redirect);
        router.refresh();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fdf3e3] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#9a6820] uppercase mb-4">
            The Upper Notch
          </span>
          <h1 className="text-2xl font-bold text-[#15314a]">Dashboard Access</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20"
            required
            autoFocus
          />

          {error && (
            <p className="text-sm text-rose-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#d2a86c] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9a6820] disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Checking…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
