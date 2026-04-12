import {
  mockUserPoints,
  mockRewardTransactions,
  mockLatestRewardSummary,
} from "../data/mockRewards";

export function getPointsBalance() {
  return mockUserPoints;
}

export function getRewardTransactions() {
  return mockRewardTransactions;
}

export function getLatestRewardSummary() {
  return mockLatestRewardSummary;
}

export async function createRewardTransaction({
  child_id,
  task_id,
  points_earned,
  steps_completed,
  transaction_type = "earn",
}) {
  const newTransaction = {
    transaction_id: Date.now(),
    child_id,
    task_id,
    points_earned,
    steps_completed,
    transaction_type,
    created_at: new Date().toISOString(),
  };

  return { data: newTransaction, error: null };
}