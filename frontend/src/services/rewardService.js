const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://127.0.0.1:8000";

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

  const result = await apiRequest(`/api/points/${resolvedChildId}`, {
    method: "GET",
  });

  if (result.error || !result.data) {
    return { data: emptyPoints(resolvedChildId), error: null };
  }

  return { data: result.data, error: null };
}

export async function getRewardTransactions(childId) {
  const resolvedChildId = resolveActiveChildId(childId);

  if (!resolvedChildId) {
    return { data: [], error: null };
  }

  const result = await apiRequest(`/api/reward-transactions/${resolvedChildId}`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
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
  return apiRequest("/api/reward-transactions", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      task_id,
      points_earned,
      steps_completed,
      transaction_type,
    }),
  });
}

export async function claimReward({ child_id, reward_id }) {
  return apiRequest("/api/rewards/claim", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      reward_id,
    }),
  });
}

export async function updatePointsBalance(childId, newPointsBalance) {
  const normalizedChildId = String(childId);

  return apiRequest(`/api/points/${normalizedChildId}`, {
    method: "PATCH",
    body: JSON.stringify({
      points_balance: Number(newPointsBalance),
    }),
  });
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
  const result = await apiRequest("/api/rewards?approved=true", {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function getAllRewardsForParent() {
  const result = await apiRequest("/api/rewards", {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function createParentReward(payload) {
  return apiRequest("/api/rewards", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      emoji: payload.emoji || "🎁",
      cost: Number(payload.cost),
      approved: payload.approved ?? true,
      theme: payload.theme || "custom",
    }),
  });
}

export async function updateParentReward(rewardId, payload) {
  const normalizedRewardId = String(rewardId);

  return apiRequest(`/api/rewards/${normalizedRewardId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: payload.title,
      emoji: payload.emoji || "🎁",
      cost: Number(payload.cost),
      approved: payload.approved ?? true,
      theme: payload.theme || "custom",
    }),
  });
}

export async function deleteParentReward(rewardId) {
  const normalizedRewardId = String(rewardId);

  return apiRequest(`/api/rewards/${normalizedRewardId}`, {
    method: "DELETE",
  });
}
