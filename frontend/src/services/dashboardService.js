import { getCachedResource } from "./requestCache";

const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://127.0.0.1:8000";

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

export async function getParentDashboardCore(parentId, childId) {
  if (!parentId) {
    return { data: null, error: "Parent account is required." };
  }

  const query = childId ? `?child_id=${encodeURIComponent(childId)}` : "";

  const result = await getCachedResource(
    `parent-dashboard-core:${parentId}:${childId || "first-child"}`,
    () =>
      apiRequest(`/api/parent-dashboard/core/${parentId}${query}`, {
        method: "GET",
      }),
    { ttlMs: 30000 }
  );

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error || "Could not load parent dashboard.",
    };
  }

  return { data: result.data, error: null };
}

export async function getParentDashboardSupport(childId) {
  if (!childId) {
    return {
      data: {
        triggers: [],
        suggestions: [],
        routineBlocks: [],
        communicationPrompts: [],
        supportResources: [],
        emotionLogs: [],
      },
      error: null,
    };
  }

  const result = await getCachedResource(
    `parent-dashboard-support:${childId}`,
    () =>
      apiRequest(`/api/parent-dashboard/support/${childId}`, {
        method: "GET",
      }),
    { ttlMs: 30000 }
  );

  if (result.error || !result.data) {
    return {
      data: {
        triggers: [],
        suggestions: [],
        routineBlocks: [],
        communicationPrompts: [],
        supportResources: [],
        emotionLogs: [],
      },
      error: result.error || null,
    };
  }

  return { data: result.data, error: null };
}