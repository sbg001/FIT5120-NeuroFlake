import { getCachedResource, invalidateCachePrefix } from "./requestCache";

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

export async function getCommunicationPrompts(childId) {
  const query = childId ? `?child_id=${encodeURIComponent(childId)}` : "";

  const result = await getCachedResource(
    `communication-prompts:${childId || "all"}`,
    () =>
      apiRequest(`/api/communication-prompts${query}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function createCommunicationPrompt({
  child_id,
  title,
  prompt_text,
  category,
}) {
  if (!title || !prompt_text) {
    return { data: null, error: "Please complete all prompt fields." };
  }

  const result = await apiRequest("/api/communication-prompts", {
    method: "POST",
    body: JSON.stringify({
      child_id: child_id || null,
      title,
      prompt_text,
      category: category || "general",
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("communication-prompts:");
  }

  return result;
}

export async function getSupportResources() {
  const result = await getCachedResource(
    "support-resources:all",
    () =>
      apiRequest("/api/support-resources", {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function createSupportResource({
  title,
  category,
  description,
  url,
}) {
  if (!title || !category || !description) {
    return { data: null, error: "Please complete all resource fields." };
  }

  const result = await apiRequest("/api/support-resources", {
    method: "POST",
    body: JSON.stringify({
      title,
      category,
      description,
      url: url || null,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("support-resources:");
  }

  return result;
}
