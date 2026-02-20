import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: agentActions } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: deposits } = await supabase
    .from("deposits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Check if bot is online (heartbeat within last 30s)
  const { data: botState } = await supabase
    .from("bot_state")
    .select("last_heartbeat")
    .eq("id", 1)
    .single();

  const botOnline = botState?.last_heartbeat
    ? Date.now() - new Date(botState.last_heartbeat).getTime() < 30000
    : false;

  return (
    <DashboardClient
      user={user}
      profile={profile}
      agentActions={agentActions || []}
      deposits={deposits || []}
      withdrawals={withdrawals || []}
      botOnline={botOnline}
    />
  );
}
