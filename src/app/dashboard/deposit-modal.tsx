"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DepositModalProps {
  userId: string;
  onClose: () => void;
}

export default function DepositModal({ userId, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) return;
    if (!senderAddress.trim() || senderAddress.trim().length < 10) {
      setError("Enter the wallet address you're sending from.");
      return;
    }
    setLoading(true);

    const { error: insertError } = await supabase.from("deposits").insert({
      user_id: userId,
      amount: Number(amount),
      sender_address: senderAddress.trim().toLowerCase(),
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-6 z-50">
      <div
        className="rounded-xl p-6 w-full max-w-md"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Deposit</h2>
          <button
            onClick={onClose}
            className="transition-colors hover:text-white"
            style={{ color: "var(--text-gray)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="font-medium mb-2" style={{ color: "var(--profit)" }}>
              Deposit recorded!
            </p>
            <p className="text-sm" style={{ color: "var(--text-gray)" }}>
              Your balance will update once the deposit is confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-4 text-black font-semibold px-6 py-2.5 rounded-md text-sm transition-all"
              style={{ background: "var(--profit)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              className="rounded-lg p-4 mb-4"
              style={{
                background: "var(--bg-void)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-sm mb-1"
                style={{ color: "var(--text-gray)" }}
              >
                Send USDC (Polygon) to this address
              </p>
              <p
                className="text-sm break-all"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || "Not configured"}
              </p>
            </div>

            <p
              className="text-xs mb-6"
              style={{ color: "var(--text-gray)" }}
            >
              Your balance will update automatically once confirmed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="sender-address"
                  className="block text-sm mb-1.5"
                  style={{ color: "var(--text-gray)" }}
                >
                  Your Wallet Address (sending from)
                </label>
                <input
                  id="sender-address"
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  required
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors"
                  style={{
                    background: "var(--bg-void)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-code)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--profit)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.12)")
                  }
                  placeholder="0x..."
                />
              </div>

              <div>
                <label
                  htmlFor="deposit-amount"
                  className="block text-sm mb-1.5"
                  style={{ color: "var(--text-gray)" }}
                >
                  Amount (USDC)
                </label>
                <input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  placeholder="1.00"
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-black font-semibold py-2.5 rounded-md text-sm transition-all disabled:opacity-50"
                style={{ background: "var(--profit)" }}
              >
                {loading ? "Submitting..." : "I've sent it"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
