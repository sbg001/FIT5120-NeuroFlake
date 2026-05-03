import { getCachedResource, invalidateCachePrefix } from "./requestCache";

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

export async function getTasks(childId) {
  const resolvedChildId = childId || getCurrentChildId();
  const query = resolvedChildId ? `?child_id=${encodeURIComponent(resolvedChildId)}` : "";

  const result = await getCachedResource(
    `tasks:${resolvedChildId || "all"}`,
    () =>
      apiRequest(`/api/tasks${query}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function getTaskById(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await getCachedResource(
    `task:${normalizedTaskId}`,
    () =>
      apiRequest(`/api/tasks/${normalizedTaskId}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

export async function getTaskSteps(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await getCachedResource(
    `task-steps:${normalizedTaskId}`,
    () =>
      apiRequest(`/api/tasks/${normalizedTaskId}/steps`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: result.error || null };
  }

  return { data: result.data, error: null };
}

export async function getTodayTask(childId) {
  const resolvedChildId = childId || getCurrentChildId();
  const query = resolvedChildId ? `?child_id=${encodeURIComponent(resolvedChildId)}` : "";

  const result = await getCachedResource(
    `today-task:${resolvedChildId || "all"}`,
    () =>
      apiRequest(`/api/today-task${query}`, {
        method: "GET",
      }),
    { ttlMs: 15000 }
  );

  if (result.error || !result.data) {
    return { data: null, error: null };
  }

  return { data: result.data, error: null };
}

export async function createTask(payload) {
  const result = await apiRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      child_id: payload.child_id,
      created_by: payload.created_by,
      title: payload.title,
      description: payload.description,
      status: payload.status || "pending",
      total_steps: payload.total_steps || 0,
      completed_steps: payload.completed_steps || 0,
      priority_type: payload.priority_type || null,
      priority_rank: payload.priority_rank || null,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}

export async function createTaskStep(payload) {
  const result = await apiRequest("/api/task-steps", {
    method: "POST",
    body: JSON.stringify({
      task_id: payload.task_id,
      step_order: payload.step_order,
      step_title: payload.step_title,
      step_description: payload.step_description || null,
      is_completed: payload.is_completed || false,
      completed_at: payload.completed_at || null,
      visual_hint: payload.visual_hint || null,
      example_text: payload.example_text || null,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix(`task-steps:${payload.task_id}`);
    invalidateCachePrefix(`task:${payload.task_id}`);
    invalidateCachePrefix("tasks:");
  }

  return result;
}

export async function updateTask(taskId, payload) {
  const normalizedTaskId = String(taskId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      priority_type: payload.priority_type || null,
      priority_rank: payload.priority_rank || null,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}

export async function updateTaskStep(stepId, payload) {
  const normalizedStepId = String(stepId);

  const result = await apiRequest(`/api/task-steps/${normalizedStepId}`, {
    method: "PATCH",
    body: JSON.stringify({
      step_order: payload.step_order,
      step_title: payload.step_title,
      step_description: payload.step_description || null,
      visual_hint: payload.visual_hint || null,
      example_text: payload.example_text || null,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("task-steps:");
    invalidateCachePrefix("task:");
    invalidateCachePrefix("tasks:");
  }

  return result;
}

export async function deleteTask(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}`, {
    method: "DELETE",
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix(`task-steps:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}

export async function deleteTaskStep(stepId) {
  const normalizedStepId = String(stepId);

  const result = await apiRequest(`/api/task-steps/${normalizedStepId}`, {
    method: "DELETE",
  });

  if (!result.error) {
    invalidateCachePrefix("task-steps:");
    invalidateCachePrefix("task:");
    invalidateCachePrefix("tasks:");
  }

  return result;
}

export async function updateTaskStepCount(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}/step-count`, {
    method: "PATCH",
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
  }

  return result;
}

export async function resetTaskStatus(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}/reset`, {
    method: "POST",
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix(`task-steps:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}

export async function completeStep(taskId, stepId) {
  const normalizedTaskId = String(taskId);
  const normalizedStepId = String(stepId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}/complete-step/${normalizedStepId}`, {
    method: "POST",
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix(`task-steps:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}

export async function completeTask(taskId) {
  const normalizedTaskId = String(taskId);

  const result = await apiRequest(`/api/tasks/${normalizedTaskId}/complete`, {
    method: "POST",
  });

  if (!result.error) {
    invalidateCachePrefix(`task:${normalizedTaskId}`);
    invalidateCachePrefix(`task-steps:${normalizedTaskId}`);
    invalidateCachePrefix("tasks:");
    invalidateCachePrefix("today-task:");
  }

  return result;
}
