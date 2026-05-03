const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "";

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

export async function getTriggers(childId) {
  const query = childId ? `?child_id=${encodeURIComponent(childId)}` : "";

  const result = await apiRequest(`/api/triggers${query}`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function createTrigger({
  child_id,
  trigger_title,
  trigger_type,
  notes,
}) {
  if (!child_id || !trigger_title || !trigger_type) {
    return { data: null, error: "Please complete all trigger fields." };
  }

  return apiRequest("/api/triggers", {
    method: "POST",
    body: JSON.stringify({
      child_id,
      trigger_title,
      trigger_type,
      notes: notes || null,
    }),
  });
}

export async function getPersonalisedSuggestions(childId) {
  if (!childId) {
    return { data: [], error: null };
  }

  const result = await apiRequest(`/api/suggestions/${childId}`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}
