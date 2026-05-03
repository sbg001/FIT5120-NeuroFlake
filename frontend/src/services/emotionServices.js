import { mockEmotionOptions } from "../data/mockEmotion";

const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "";

function getCurrentChildId() {
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

export async function getEmotionOptions() {
  return { data: mockEmotionOptions, error: null };
}

export async function getEmotionLogs(childId) {
  const resolvedChildId = childId || getCurrentChildId();
  const query = resolvedChildId ? `?child_id=${encodeURIComponent(resolvedChildId)}` : "";

  const result = await apiRequest(`/api/emotions${query}`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function saveEmotionSelection({
  child_id,
  emotion_type,
  linked_task_id,
  notes = null,
}) {
  if (!child_id || !emotion_type) {
    return { data: null, error: "Missing child or emotion type." };
  }

  return apiRequest("/api/emotions", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      emotion_type,
      linked_task_id: linked_task_id || null,
      notes,
    }),
  });
}

export async function skipEmotionCheckIn(child_id, linked_task_id) {
  if (!child_id) {
    return { data: null, error: "Missing child id." };
  }

  return apiRequest("/api/emotions", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      emotion_type: "skipped",
      linked_task_id: linked_task_id || null,
      notes: null,
    }),
  });
}
