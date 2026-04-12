export const mockUserPoints = {
  id: 1,
  child_id: 1,
  points_balance: 45,
  updated_at: "2026-04-12T16:00:00Z",
};

export const mockRewardTransactions = [
  {
    transaction_id: 1,
    child_id: 1,
    task_id: 1,
    points_earned: 15,
    steps_completed: 3,
    transaction_type: "earn",
    created_at: "2026-04-10T09:00:00Z",
  },
  {
    transaction_id: 2,
    child_id: 1,
    task_id: 2,
    points_earned: 10,
    steps_completed: 1,
    transaction_type: "earn",
    created_at: "2026-04-12T15:15:00Z",
  },
];

export const mockLatestRewardSummary = {
  task_id: 2,
  points_earned: 10,
  steps_completed: 1,
  updated_points_balance: 45,
  celebration_message: "Amazing work! You earned more points today.",
};