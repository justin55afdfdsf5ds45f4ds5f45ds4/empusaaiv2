import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendUsdc, getHotWalletUsdcBalance } from "@/lib/polygon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Withdrawal processor.
 * Called by Vercel Cron (or manually) to process pending withdrawals:
 *  1. Fetches all 'pending' withdrawals
 *  2. For each, sends USDC from the hot wallet to the user's wallet
 *  3. Updates the withdrawal status to 'completed' with the tx hash
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */

export async function GET(req: NextRequest) {
  // Verify the request is from our cron job or admin
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all pending withdrawals
  const { data: pending, error: fetchError } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("[withdraw] Failed to fetch pending withdrawals:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "No pending withdrawals" });
  }

  // Check hot wallet balance before processing
  let hotWalletBalance: number;
  try {
    hotWalletBalance = await getHotWalletUsdcBalance();
  } catch (err) {
    console.error("[withdraw] Failed to check hot wallet balance:", err);
    return NextResponse.json({ error: "Cannot reach hot wallet" }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; txHash?: string; error?: string }> = [];

  for (const withdrawal of pending) {
    // Skip if hot wallet doesn't have enough
    if (hotWalletBalance < withdrawal.amount) {
      console.warn(
        `[withdraw] Insufficient hot wallet balance (${hotWalletBalance}) for withdrawal ${withdrawal.id} (${withdrawal.amount})`
      );
      results.push({ id: withdrawal.id, status: "skipped", error: "Insufficient hot wallet balance" });
      continue;
    }

    // Mark as processing to prevent double-sends
    const { error: updateError } = await supabase
      .from("withdrawals")
      .update({ status: "processing" })
      .eq("id", withdrawal.id)
      .eq("status", "pending"); // optimistic lock

    if (updateError) {
      results.push({ id: withdrawal.id, status: "error", error: updateError.message });
      continue;
    }

    try {
      const { txHash } = await sendUsdc(withdrawal.wallet_address, withdrawal.amount);

      // Mark completed with tx hash
      await supabase
        .from("withdrawals")
        .update({
          status: "completed",
          tx_hash: txHash,
          completed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      hotWalletBalance -= withdrawal.amount;
      results.push({ id: withdrawal.id, status: "completed", txHash });
      console.log(`[withdraw] Sent ${withdrawal.amount} USDC to ${withdrawal.wallet_address} tx=${txHash}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[withdraw] Failed to send USDC for ${withdrawal.id}:`, message);

      // Revert to pending so it can be retried
      await supabase
        .from("withdrawals")
        .update({ status: "pending" })
        .eq("id", withdrawal.id);

      results.push({ id: withdrawal.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((r) => r.status === "completed").length,
    total: pending.length,
    results,
  });
}
