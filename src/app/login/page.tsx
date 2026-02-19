"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg-void)" }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EmpusaAI
          </span>
        </Link>

        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
          }}
        >
          <h1 className="text-xl font-semibold mb-6">Log in</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm mb-1.5"
                style={{ color: "var(--text-gray)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors"
                style={{
                  background: "var(--bg-void)",
                  border: "1px solid var(--border)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--profit)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.12)")
                }
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm mb-1.5"
                style={{ color: "var(--text-gray)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors"
                style={{
                  background: "var(--bg-void)",
                  border: "1px solid var(--border)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--profit)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.12)")
                }
                placeholder="Your password"
              />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-black font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
              style={{ background: "var(--profit)" }}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--text-gray)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="hover:underline"
              style={{ color: "var(--profit)" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
