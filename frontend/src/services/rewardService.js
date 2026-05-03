import { getCachedResource, invalidateCachePrefix } from "./requestCache";

const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "";

function resolveActiveChildId(childId) {
  if (childId) {
    return String(childId);
  }

  const currentRole = String(localStorage.getItem("current_user_role") || "").toLowerCase();
  const currentUserId = localStorage.getItem("current_user_id");

  if (currentRole === "child" && currentUserId) {
    return String(currentUserId);
  }

  return "";
}

function getCurrentParentId() {
  const currentRole = String(localStorage.getItem("current_user_role") || "").toLowerCase();
  const currentUserId = localStorage.getItem("current_user_id");

  if (currentRole === "parent" && currentUserId) {
    return String(currentUserId);
  }

  return "";
}

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data?.detail || data?.error || "Request failed.",
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.message || "Request failed.",
    };
  }
}

function emptyPoints(childId) {
  return {
    child_id: childId || null,
    points_balance: 0,
    updated_at: null,
  };
}

export async function getPointsBalance(childId) {
  const resolvedChildId = resolveActiveChildId(childId);

  if (!resolvedChildId) {
    return { data: emptyPoints(null), error: null };
  }

  const result = await getCachedResource(
    `points:${resolvedChildId}`,
    () =>
      apiRequest(`/api/points/${resolvedChildId}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !result.data) {
    return { data: emptyPoints(resolvedChildId), error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function getRewardTransactions(childId) {
  const resolvedChildId = resolveActiveChildId(childId);

  if (!resolvedChildId) {
    return { data: [], error: null };
  }

  const result = await getCachedResource(
    `reward-transactions:${resolvedChildId}`,
    () =>
      apiRequest(`/api/reward-transactions/${resolvedChildId}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function getLatestRewardSummary(childId) {
  const resolvedChildId = resolveActiveChildId(childId);

  if (!resolvedChildId) {
    return {
      data: {
        task_id: null,
        task_title: "No reward activity yet",
        points_earned: 0,
        steps_completed: 0,
        updated_points_balance: 0,
        celebration_message: "Complete a task to start earning points.",
      },
      error: null,
    };
  }

  const transactionsResult = await getRewardTransactions(resolvedChildId);
  const transactions = transactionsResult.data || [];

  const pointsResult = await getPointsBalance(resolvedChildId);
  const pointsBalance = pointsResult.data?.points_balance ?? 0;

  if (transactions.length === 0) {
    return {
      data: {
        task_id: null,
        task_title: "No reward activity yet",
        points_earned: 0,
        steps_completed: 0,
        updated_points_balance: pointsBalance,
        celebration_message: "Complete a task to start earning points.",
      },
      error: null,
    };
  }

  const latestTransaction = transactions[0];

  return {
    data: {
      task_id: latestTransaction.task_id,
      task_title: latestTransaction.task_title || "Task reward",
      points_earned: latestTransaction.points_earned || 0,
      steps_completed: latestTransaction.steps_completed || 0,
      updated_points_balance: pointsBalance,
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
  const result = await apiRequest("/api/reward-transactions", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      task_id,
      points_earned,
      steps_completed,
      transaction_type,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix(`reward-transactions:${child_id}`);
  }

  return result;
}

export async function claimReward({ child_id, reward_id }) {
  const result = await apiRequest("/api/rewards/claim", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      reward_id,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix(`points:${child_id}`);
    invalidateCachePrefix(`reward-transactions:${child_id}`);
    invalidateCachePrefix("rewards:");
  }

  return result;
}

export async function updatePointsBalance(childId, newPointsBalance) {
  const normalizedChildId = String(childId);

  const result = await apiRequest(`/api/points/${normalizedChildId}`, {
    method: "PATCH",
    body: JSON.stringify({
      points_balance: Number(newPointsBalance),
    }),
  });

  if (!result.error) {
    invalidateCachePrefix(`points:${normalizedChildId}`);
  }

  return result;
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

export async function getParentApprovedRewards(childId) {
  const resolvedChildId = resolveActiveChildId(childId);
  const parentId = getCurrentParentId();
  const query = resolvedChildId
    ? `?approved=true&child_id=${encodeURIComponent(resolvedChildId)}`
    : parentId
      ? `?approved=true&parent_id=${encodeURIComponent(parentId)}`
      : "?approved=true";

  const result = await getCachedResource(
    `rewards:approved:${resolvedChildId || parentId || "all"}`,
    () =>
      apiRequest(`/api/rewards${query}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function getAllRewardsForParent() {
  const parentId = getCurrentParentId();
  const query = parentId ? `?parent_id=${encodeURIComponent(parentId)}` : "";

  const result = await getCachedResource(
    `rewards:all:${parentId || "all"}`,
    () =>
      apiRequest(`/api/rewards${query}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function createParentReward(payload) {
  const parentId = payload.parent_id || getCurrentParentId();

  if (!parentId) {
    return { data: null, error: "Parent reward settings are not ready yet." };
  }

  const result = await apiRequest("/api/rewards", {
    method: "POST",
    body: JSON.stringify({
      parent_id: parentId,
      title: payload.title,
      emoji: payload.emoji || "🎁",
      cost: Number(payload.cost),
      approved: payload.approved ?? true,
      theme: payload.theme || "custom",
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("rewards:");
  }

  return result;
}

export async function updateParentReward(rewardId, payload) {
  const normalizedRewardId = String(rewardId);
  const parentId = payload.parent_id || getCurrentParentId();

  if (!parentId) {
    return { data: null, error: "Parent reward settings are not ready yet." };
  }

  const result = await apiRequest(`/api/rewards/${normalizedRewardId}`, {
    method: "PATCH",
    body: JSON.stringify({
      parent_id: parentId,
      title: payload.title,
      emoji: payload.emoji || "🎁",
      cost: Number(payload.cost),
      approved: payload.approved ?? true,
      theme: payload.theme || "custom",
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("rewards:");
  }

  return result;
}

export async function deleteParentReward(rewardId) {
  const normalizedRewardId = String(rewardId);
  const parentId = getCurrentParentId();

  if (!parentId) {
    return { data: null, error: "Parent reward settings are not ready yet." };
  }

  const result = await apiRequest(
    `/api/rewards/${normalizedRewardId}?parent_id=${encodeURIComponent(parentId)}`,
    {
      method: "DELETE",
    }
  );

  if (!result.error) {
    invalidateCachePrefix("rewards:");
  }

  return result;
}
