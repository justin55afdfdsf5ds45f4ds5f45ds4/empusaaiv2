export interface Profile {
  id: string;
  balance: number;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  sender_address: string | null;
  tx_hash: string | null;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  confirmed_at: string | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  tx_hash: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
}

export interface AgentAction {
  id: string;
  user_id: string;
  market_name: string;
  side: "YES" | "NO";
  entry_price: number;
  current_price: number | null;
  exit_price: number | null;
  amount: number;
  profit_loss: number | null;
  status: "active" | "closed" | "pending";
  created_at: string;
  closed_at: string | null;
}
