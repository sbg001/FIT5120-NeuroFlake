import {
  mockUserPoints,
  mockRewardTransactions,
  mockLatestRewardSummary,
} from "../data/mockRewards";
import { supabase } from "../lib/supabase";

export async function getPointsBalance() {
  const { data, error } = await supabase
    .from("user_points")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: mockUserPoints, error: null };
  }

  return { data, error: null };
}

export async function getRewardTransactions() {
  const { data, error } = await supabase
    .from("reward_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { data: mockRewardTransactions, error: null };
  }

  return { data, error: null };
}

export async function getLatestRewardSummary() {
  const { data, error } = await supabase
    .from("reward_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: mockLatestRewardSummary, error: null };
  }

  return {
    data: {
      task_id: data.task_id,
      points_earned: data.points_earned,
      steps_completed: data.steps_completed,
      updated_points_balance: mockUserPoints.points_balance,
      celebration_message: "Amazing work! You earned more points today.",
    },
    error: null,
  };
}

export async function createRewardTransaction({
  child_id,
  task_id,
  points_earned,
  steps_completed,
  transaction_type = "earn",
}) {
  const payload = {
    child_id,
    task_id,
    points_earned,
    steps_completed,
    transaction_type,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("reward_transactions")
    .insert(payload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      data: {
        transaction_id: Date.now(),
        ...payload,
      },
      error: null,
    };
  }

  return { data, error: null };
}