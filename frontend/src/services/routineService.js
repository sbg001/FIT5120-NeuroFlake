const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://127.0.0.1:8000";

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

export async function getRoutines(childId) {
  const resolvedChildId = childId || getCurrentChildId();
  const query = resolvedChildId ? `?child_id=${encodeURIComponent(resolvedChildId)}` : "";

  const result = await apiRequest(`/api/routines${query}`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function getRoutineItems(routineId) {
  if (!routineId) {
    return { data: [], error: null };
  }

  const result = await apiRequest(`/api/routines/${routineId}/items`, {
    method: "GET",
  });

  if (result.error || !Array.isArray(result.data)) {
    return { data: [], error: null };
  }

  return { data: result.data, error: null };
}

export async function getRoutineBlocksWithItems(childId) {
  const routinesResult = await getRoutines(childId);
  const routines = routinesResult.data || [];

  const blocks = await Promise.all(
    routines.map(async (routine) => {
      const itemsResult = await getRoutineItems(routine.routine_id);
      const items = itemsResult.data || [];
      const completed_count = items.filter((item) => item.is_completed).length;

      return {
        ...routine,
        completed_count,
        total_count: items.length,
        items,
      };
    })
  );

  return { data: blocks, error: null };
}

export async function updateRoutineItem(itemId, isCompleted) {
  if (!itemId) {
    return { data: null, error: "Routine item not found." };
  }

  return apiRequest(`/api/routine-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({
      is_completed: Boolean(isCompleted),
    }),
  });
}