"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface WithdrawModalProps {
  userId: string;
  balance: number;
  onClose: () => void;
}

export default function WithdrawModal({
  balance,
  onClose,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (numAmount > Number(balance)) {
      setError("Amount exceeds your balance.");
      return;
    }
    if (!walletAddress.trim()) {
      setError("Enter your wallet address.");
      return;
    }

    setLoading(true);

    const { error: rpcError } = await supabase.rpc("request_withdrawal", {
      p_amount: numAmount,
      p_wallet_address: walletAddress.trim(),
    });

    if (rpcError) {
      setError(rpcError.message);
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
          <h2 className="text-lg font-semibold">Withdraw</h2>
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
              Withdrawal submitted!
            </p>
            <p className="text-sm" style={{ color: "var(--text-gray)" }}>
              Withdrawal processing. Usually completes within 10 minutes.
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="withdraw-amount"
                className="block text-sm mb-1.5"
                style={{ color: "var(--text-gray)" }}
              >
                Amount (USD)
              </label>
              <input
                id="withdraw-amount"
                type="number"
                min="0.01"
                step="0.01"
                max={Number(balance)}
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
                placeholder="0.00"
              />
              <p
                className="text-xs mt-1"
                style={{
                  color: "var(--text-gray)",
                  fontFamily: "var(--font-code)",
                }}
              >
                Available: ${Number(balance).toFixed(2)}
              </p>
            </div>

            <div>
              <label
                htmlFor="wallet-address"
                className="block text-sm mb-1.5"
                style={{ color: "var(--text-gray)" }}
              >
                Wallet Address
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
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
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
