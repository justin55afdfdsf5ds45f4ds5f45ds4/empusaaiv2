import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Force Node.js runtime (crypto module needs it)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inline constants to avoid importing ethers (heavy, not needed here)
const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_DECIMALS = 6;

function verifyAlchemySignature(
  body: string,
  signature: string | null
): boolean {
  const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.error("ALCHEMY_WEBHOOK_SIGNING_KEY not set");
    return false;
  }
  if (!signature) return false;

  const hmac = createHmac("sha256", signingKey);
  hmac.update(body);
  const expected = hmac.digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-alchemy-signature");

    // Verify webhook authenticity
    if (!verifyAlchemySignature(rawBody, signature)) {
      console.log("[webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const platformWallet = process.env.PLATFORM_WALLET_ADDRESS?.toLowerCase();
    if (!platformWallet) {
      console.error("PLATFORM_WALLET_ADDRESS not set");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const supabase = createAdminClient();

    // Alchemy Address Activity webhook sends an array of activities
    const activities = payload?.event?.activity;
    if (!Array.isArray(activities)) {
      return NextResponse.json({ ok: true, message: "No activities" });
    }

    let confirmed = 0;

    for (const activity of activities) {
      // Only process incoming token transfers of USDC to our wallet
      // Alchemy uses "token" on Polygon, "erc20" on Ethereum
      if (activity.category !== "erc20" && activity.category !== "token") continue;

      // Check contract address from rawContract or log
      const contractAddr =
        activity.rawContract?.address?.toLowerCase() ||
        activity.log?.address?.toLowerCase() ||
        "";
      if (contractAddr !== USDC_ADDRESS.toLowerCase()) continue;
      if (activity.toAddress?.toLowerCase() !== platformWallet) continue;

      const fromAddress = activity.fromAddress?.toLowerCase();
      const rawValue = activity.rawContract?.rawValue || activity.log?.data;
      if (!fromAddress || !rawValue) continue;

      // Convert raw value to human amount
      // rawValue can be hex string or the "value" field might already be a number
      let amount: number;
      try {
        const amountBigInt = BigInt(rawValue);
        amount = Number(amountBigInt) / Math.pow(10, USDC_DECIMALS);
      } catch {
        // Fallback: Alchemy sometimes provides a numeric "value" field directly
        amount = Number(activity.value) || 0;
      }
      if (amount <= 0) continue;

      const txHash = activity.hash || null;

      console.log(
        `[deposit] USDC received: ${amount} from ${fromAddress} tx=${txHash}`
      );

      // Find a matching pending deposit
      const { data: pendingDeposits } = await supabase
        .from("deposits")
        .select("id, amount, user_id")
        .eq("status", "pending")
        .eq("sender_address", fromAddress)
        .gte("amount", amount - 0.01)
        .lte("amount", amount + 0.01)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!pendingDeposits || pendingDeposits.length === 0) {
        console.log(`[deposit] No matching pending deposit for ${amount} from ${fromAddress}`);
        continue;
      }

      const deposit = pendingDeposits[0];

      // Store the tx hash on the deposit
      if (txHash) {
        await supabase
          .from("deposits")
          .update({ tx_hash: txHash })
          .eq("id", deposit.id);
      }

      // Confirm the deposit (credits balance atomically via security definer function)
      const { error } = await supabase.rpc("confirm_deposit", {
        p_deposit_id: deposit.id,
      });

      if (error) {
        console.error(`[deposit] Failed to confirm deposit ${deposit.id}:`, error.message);
        continue;
      }

      console.log(`[deposit] Confirmed deposit ${deposit.id} for user ${deposit.user_id}`);
      confirmed++;
    }

    return NextResponse.json({ ok: true, confirmed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
