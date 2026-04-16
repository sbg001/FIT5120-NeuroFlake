import {
  mockUserPoints,
  mockRewardTransactions,
  mockLatestRewardSummary,
} from "../data/mockRewards";
import { mockTasks } from "../data/mockTasks";
import { supabase } from "../lib/supabase";

function getMockTaskTitle(taskId) {
  const task = mockTasks.find((item) => String(item.task_id) === String(taskId));
  return task?.title || "Task reward";
}

async function attachTaskTitles(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  if (!supabase) {
    return transactions.map((transaction) => ({
      ...transaction,
      task_title: getMockTaskTitle(transaction.task_id),
    }));
  }

  const taskIds = [...new Set(transactions.map((item) => item.task_id).filter(Boolean))];

  if (taskIds.length === 0) {
    return transactions;
  }

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("task_id, title")
    .in("task_id", taskIds);

  const taskTitleMap = {};
  (tasksData || []).forEach((task) => {
    taskTitleMap[String(task.task_id)] = task.title;
  });

  return transactions.map((transaction) => ({
    ...transaction,
    task_title:
      taskTitleMap[String(transaction.task_id)] ||
      getMockTaskTitle(transaction.task_id),
  }));
}

export async function getPointsBalance() {
  if (!supabase) {
    return { data: mockUserPoints, error: null };
  }

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
  if (!supabase) {
    const enrichedMockTransactions = await attachTaskTitles(mockRewardTransactions);
    return { data: enrichedMockTransactions, error: null };
  }

  const { data, error } = await supabase
    .from("reward_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    const enrichedMockTransactions = await attachTaskTitles(mockRewardTransactions);
    return { data: enrichedMockTransactions, error: null };
  }

  const enrichedTransactions = await attachTaskTitles(data);
  return { data: enrichedTransactions, error: null };
}

export async function getLatestRewardSummary() {
  if (!supabase) {
    return {
      data: {
        ...mockLatestRewardSummary,
        task_title: getMockTaskTitle(mockLatestRewardSummary.task_id),
      },
      error: null,
    };
  }

  const { data: latestTransaction, error: latestError } = await supabase
    .from("reward_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latestTransaction) {
    return {
      data: {
        ...mockLatestRewardSummary,
        task_title: getMockTaskTitle(mockLatestRewardSummary.task_id),
      },
      error: null,
    };
  }

  const enrichedTransactions = await attachTaskTitles([latestTransaction]);
  const enrichedLatestTransaction = enrichedTransactions[0];

  const { data: pointsData } = await supabase
    .from("user_points")
    .select("*")
    .limit(1)
    .maybeSingle();

  const updatedPointsBalance =
    pointsData?.points_balance ?? mockUserPoints.points_balance;

  return {
    data: {
      task_id: enrichedLatestTransaction.task_id,
      task_title: enrichedLatestTransaction.task_title,
      points_earned: enrichedLatestTransaction.points_earned,
      steps_completed: enrichedLatestTransaction.steps_completed,
      updated_points_balance: updatedPointsBalance,
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

  if (!supabase) {
    return {
      data: {
        transaction_id: Date.now(),
        ...payload,
      },
      error: null,
    };
  }

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

export async function updatePointsBalance(childId, newPointsBalance) {
  const normalizedChildId = String(childId);
  const now = new Date().toISOString();

  if (!supabase) {
    mockUserPoints.points_balance = newPointsBalance;
    mockUserPoints.updated_at = now;

    return { data: mockUserPoints, error: null };
  }

  const { data, error } = await supabase
    .from("user_points")
    .update({
      points_balance: newPointsBalance,
      updated_at: now,
    })
    .eq("child_id", normalizedChildId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    mockUserPoints.points_balance = newPointsBalance;
    mockUserPoints.updated_at = now;

    return { data: mockUserPoints, error: null };
  }

  return { data, error: null };
}

export function getRewardMilestoneMessage(pointsBalance) {
  if (pointsBalance >= 300) {
    return "Super Star level unlocked!";
  }
  if (pointsBalance >= 200) {
    return "Amazing progress milestone reached!";
  }
  if (pointsBalance >= 100) {
    return "Great job — a big reward milestone is unlocked!";
  }
  if (pointsBalance >= 50) {
    return "First reward milestone reached!";
  }
  return "You are getting closer to your next reward.";
}

export function getEncouragingMessage(pointsBalance, transactionCount) {
  if (transactionCount >= 8) {
    return "You have been doing an amazing job staying consistent.";
  }
  if (pointsBalance >= 100) {
    return "You are building strong progress every day.";
  }
  return "Every step you finish is something to be proud of.";
}

export function getSuggestedRewards() {
  return [
    {
      id: "reward-1",
      emoji: "⭐",
      title: "Choose a Sticker",
      cost: 20,
      approved: true,
      theme: "characters",
    },
    {
      id: "reward-2",
      emoji: "📚",
      title: "Extra Story Time",
      cost: 40,
      approved: true,
      theme: "calm",
    },
    {
      id: "reward-3",
      emoji: "🎨",
      title: "Pick a Fun Theme",
      cost: 60,
      approved: true,
      theme: "interests",
    },
  ];
}

export async function getParentApprovedRewards() {
  const fallbackRewards = [
    {
      id: "parent-reward-1",
      emoji: "🍿",
      title: "Movie Night Pick",
      cost: 80,
      approved: true,
      theme: "family",
    },
    {
      id: "parent-reward-2",
      emoji: "🧸",
      title: "Choose a Small Toy",
      cost: 120,
      approved: true,
      theme: "favourite things",
    },
  ];

  if (!supabase) {
    return { data: fallbackRewards, error: null };
  }

  const { data, error } = await supabase
    .from("rewards_catalog")
    .select("*")
    .eq("approved", true)
    .order("points_cost", { ascending: true });

  if (error || !data || data.length === 0) {
    return { data: fallbackRewards, error: null };
  }

  const normalizedRewards = data.map((reward) => ({
    id: reward.reward_id || reward.id,
    emoji: reward.emoji || "🎁",
    title: reward.title,
    cost: reward.points_cost,
    approved: reward.approved,
    theme: reward.theme || "custom",
  }));

  return { data: normalizedRewards, error: null };
}

// =======================
// GET ALL REWARDS FOR PARENT
// =======================
export async function getAllRewardsForParent() {
  const fallbackRewards = [
    {
      id: "parent-reward-1",
      emoji: "🍿",
      title: "Movie Night Pick",
      cost: 80,
      approved: true,
      theme: "family",
    },
    {
      id: "parent-reward-2",
      emoji: "🧸",
      title: "Choose a Small Toy",
      cost: 120,
      approved: true,
      theme: "favourite things",
    },
  ];

  if (!supabase) {
    return { data: fallbackRewards, error: null };
  }

  const { data, error } = await supabase
    .from("rewards_catalog")
    .select("*")
    .order("points_cost", { ascending: true });

  if (error || !data) {
    return { data: fallbackRewards, error: null };
  }

  const normalizedRewards = data.map((reward) => ({
    id: reward.reward_id || reward.id,
    emoji: reward.emoji || "🎁",
    title: reward.title,
    cost: reward.points_cost,
    approved: reward.approved,
    theme: reward.theme || "custom",
  }));

  return { data: normalizedRewards, error: null };
}

// =======================
// CREATE REWARD
// =======================
export async function createParentReward(payload) {
  const rewardPayload = {
    title: payload.title,
    emoji: payload.emoji || "🎁",
    points_cost: Number(payload.cost),
    approved: payload.approved ?? true,
    theme: payload.theme || "custom",
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    return {
      data: {
        id: `mock-reward-${Date.now()}`,
        emoji: rewardPayload.emoji,
        title: rewardPayload.title,
        cost: rewardPayload.points_cost,
        approved: rewardPayload.approved,
        theme: rewardPayload.theme,
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("rewards_catalog")
    .insert(rewardPayload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      id: data.reward_id || data.id,
      emoji: data.emoji || "🎁",
      title: data.title,
      cost: data.points_cost,
      approved: data.approved,
      theme: data.theme || "custom",
    },
    error: null,
  };
}

// =======================
// UPDATE REWARD
// =======================
export async function updateParentReward(rewardId, payload) {
  const normalizedRewardId = String(rewardId);

  const updatePayload = {
    title: payload.title,
    emoji: payload.emoji || "🎁",
    points_cost: Number(payload.cost),
    approved: payload.approved ?? true,
    theme: payload.theme || "custom",
  };

  if (!supabase) {
    return {
      data: {
        id: normalizedRewardId,
        emoji: updatePayload.emoji,
        title: updatePayload.title,
        cost: updatePayload.points_cost,
        approved: updatePayload.approved,
        theme: updatePayload.theme,
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("rewards_catalog")
    .update(updatePayload)
    .eq("reward_id", normalizedRewardId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      id: data.reward_id || data.id,
      emoji: data.emoji || "🎁",
      title: data.title,
      cost: data.points_cost,
      approved: data.approved,
      theme: data.theme || "custom",
    },
    error: null,
  };
}

// =======================
// DELETE REWARD
// =======================
export async function deleteParentReward(rewardId) {
  const normalizedRewardId = String(rewardId);

  if (!supabase) {
    return { data: { id: normalizedRewardId }, error: null };
  }

  const { error } = await supabase
    .from("rewards_catalog")
    .delete()
    .eq("reward_id", normalizedRewardId);

  if (error) {
    return { data: null, error };
  }

  return { data: { id: normalizedRewardId }, error: null };
}