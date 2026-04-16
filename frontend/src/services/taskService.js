import { mockTasks } from "../data/mockTasks";
import { supabase } from "../lib/supabase";

// =======================
// GET ALL TASKS
// =======================
export async function getTasks() {
  if (!supabase) {
    return { data: mockTasks, error: null };
  }

  const { data, error } = await supabase.from("tasks").select("*");

  if (error || !data || data.length === 0) {
    return { data: mockTasks, error: null };
  }

  return { data, error: null };
}

// =======================
// GET TASK BY ID
// =======================
export async function getTaskById(taskId) {
  const normalizedTaskId = String(taskId);

  if (!supabase) {
    const mockTask =
      mockTasks.find((task) => String(task.task_id) === normalizedTaskId) || null;
    return { data: mockTask, error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("task_id", normalizedTaskId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const mockTask =
      mockTasks.find((task) => String(task.task_id) === normalizedTaskId) || null;
    return { data: mockTask, error: null };
  }

  return { data, error: null };
}

// =======================
// GET TASK STEPS
// =======================
export async function getTaskSteps(taskId) {
  const normalizedTaskId = String(taskId);

  if (!supabase) {
    const mockTask =
      mockTasks.find((task) => String(task.task_id) === normalizedTaskId) || null;
    return { data: mockTask ? mockTask.steps : [], error: null };
  }

  const { data, error } = await supabase
    .from("task_steps")
    .select("*")
    .eq("task_id", normalizedTaskId)
    .order("step_order", { ascending: true });

  if (error || !data || data.length === 0) {
    const mockTask =
      mockTasks.find((task) => String(task.task_id) === normalizedTaskId) || null;
    return { data: mockTask ? mockTask.steps : [], error: null };
  }

  return { data, error: null };
}

// =======================
// GET TODAY'S TASK
// =======================
export async function getTodayTask() {
  if (!supabase) {
    return { data: mockTasks[0] || null, error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: mockTasks[0] || null, error: null };
  }

  return { data, error: null };
}

// =======================
// CREATE TASK
// =======================
export async function createTask(payload) {
  const taskPayload = {
    child_id: payload.child_id,
    created_by: payload.created_by,
    title: payload.title,
    description: payload.description,
    status: payload.status || "pending",
    total_steps: payload.total_steps || 0,
    completed_steps: payload.completed_steps || 0,
    priority_type: payload.priority_type || null,
    priority_rank: payload.priority_rank || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const newTask = {
      task_id: `mock-${Date.now()}`,
      ...taskPayload,
      steps: [],
    };

    mockTasks.push(newTask);

    return { data: newTask, error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskPayload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// CREATE TASK STEP
// =======================
export async function createTaskStep(payload) {
  const stepPayload = {
    task_id: payload.task_id,
    step_order: payload.step_order,
    step_title: payload.step_title,
    step_description: payload.step_description || null,
    is_completed: payload.is_completed || false,
    completed_at: payload.completed_at || null,
    visual_hint: payload.visual_hint || null,
    example_text: payload.example_text || null,
  };

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === String(payload.task_id)) ||
      null;
    const newStep = {
      step_id: `mock-step-${Date.now()}-${payload.step_order}`,
      ...stepPayload,
    };

    if (task) {
      task.steps = Array.isArray(task.steps) ? task.steps : [];
      task.steps.push(newStep);
      task.steps.sort((a, b) => Number(a.step_order) - Number(b.step_order));
      task.total_steps = task.steps.length;
      task.updated_at = new Date().toISOString();
    }

    return { data: newStep, error: null };
  }

  const { data, error } = await supabase
    .from("task_steps")
    .insert(stepPayload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// UPDATE TASK
// =======================
export async function updateTask(taskId, payload) {
  const normalizedTaskId = String(taskId);

  const updatePayload = {
    title: payload.title,
    description: payload.description,
    priority_type: payload.priority_type || null,
    priority_rank: payload.priority_rank || null,
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === normalizedTaskId) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    task.title = updatePayload.title;
    task.description = updatePayload.description;
    task.priority_type = updatePayload.priority_type;
    task.priority_rank = updatePayload.priority_rank;
    task.updated_at = updatePayload.updated_at;

    return { data: task, error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("task_id", normalizedTaskId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// UPDATE TASK STEP
// =======================
export async function updateTaskStep(stepId, payload) {
  const normalizedStepId = String(stepId);

  const updatePayload = {
    step_order: payload.step_order,
    step_title: payload.step_title,
    step_description: payload.step_description || null,
    visual_hint: payload.visual_hint || null,
    example_text: payload.example_text || null,
  };

  if (!supabase) {
    return {
      data: {
        step_id: normalizedStepId,
        ...updatePayload,
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("task_steps")
    .update(updatePayload)
    .eq("step_id", normalizedStepId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// DELETE TASK
// =======================
export async function deleteTask(taskId) {
  const normalizedTaskId = String(taskId);

  if (!supabase) {
    return { data: { task_id: normalizedTaskId }, error: null };
  }

  await supabase
    .from("task_steps")
    .delete()
    .eq("task_id", normalizedTaskId);

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("task_id", normalizedTaskId);

  if (error) {
    return { data: null, error };
  }

  return { data: { task_id: normalizedTaskId }, error: null };
}

// =======================
// DELETE TASK STEP
// =======================
export async function deleteTaskStep(stepId) {
  const normalizedStepId = String(stepId);

  if (!supabase) {
    return { data: { step_id: normalizedStepId }, error: null };
  }

  const { error } = await supabase
    .from("task_steps")
    .delete()
    .eq("step_id", normalizedStepId);

  if (error) {
    return { data: null, error };
  }

  return { data: { step_id: normalizedStepId }, error: null };
}

// =======================
// UPDATE TASK STEP COUNT
// =======================
export async function updateTaskStepCount(taskId) {
  const normalizedTaskId = String(taskId);

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === normalizedTaskId) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    task.total_steps = task.steps ? task.steps.length : task.total_steps;
    return { data: task, error: null };
  }

  const { count, error: countError } = await supabase
    .from("task_steps")
    .select("*", { count: "exact", head: true })
    .eq("task_id", normalizedTaskId);

  if (countError) {
    return { data: null, error: countError };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      total_steps: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("task_id", normalizedTaskId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// RESET TASK STATUS
// =======================
export async function resetTaskStatus(taskId) {
  const normalizedTaskId = String(taskId);
  const now = new Date().toISOString();

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === normalizedTaskId) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    task.status = "pending";
    task.completed_steps = 0;

    if (task.steps && Array.isArray(task.steps)) {
      task.steps.forEach((step) => {
        step.is_completed = false;
        step.completed_at = null;
      });
    }

    return { data: task, error: null };
  }

  await supabase
    .from("task_steps")
    .update({
      is_completed: false,
      completed_at: null,
    })
    .eq("task_id", normalizedTaskId);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "pending",
      completed_steps: 0,
      updated_at: now,
    })
    .eq("task_id", normalizedTaskId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// COMPLETE STEP
// =======================
export async function completeStep(taskId, stepId) {
  const normalizedTaskId = String(taskId);
  const normalizedStepId = String(stepId);
  const now = new Date().toISOString();

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === normalizedTaskId) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    const step = task.steps.find(
      (item) => String(item.step_id) === normalizedStepId
    );

    if (!step) {
      return { data: null, error: "Step not found." };
    }

    step.is_completed = true;
    step.completed_at = now;

    task.completed_steps = task.steps.filter((s) => s.is_completed).length;
    task.status =
      task.completed_steps === task.total_steps ? "completed" : "in_progress";

    return { data: task, error: null };
  }

  const { data, error } = await supabase
    .from("task_steps")
    .update({
      is_completed: true,
      completed_at: now,
    })
    .eq("step_id", normalizedStepId)
    .eq("task_id", normalizedTaskId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  const { count } = await supabase
    .from("task_steps")
    .select("*", { count: "exact", head: true })
    .eq("task_id", normalizedTaskId)
    .eq("is_completed", true);

  const completedSteps = count || 0;

  const { data: taskData } = await supabase
    .from("tasks")
    .select("total_steps")
    .eq("task_id", normalizedTaskId)
    .limit(1)
    .maybeSingle();

  const shouldBeCompleted =
    completedSteps > 0 && completedSteps === (taskData?.total_steps || 0);

  await supabase
    .from("tasks")
    .update({
      completed_steps: completedSteps,
      status: shouldBeCompleted ? "completed" : "in_progress",
      updated_at: now,
    })
    .eq("task_id", normalizedTaskId);

  return { data, error: null };
}

// =======================
// COMPLETE TASK
// =======================
export async function completeTask(taskId) {
  const normalizedTaskId = String(taskId);
  const now = new Date().toISOString();

  if (!supabase) {
    const task =
      mockTasks.find((item) => String(item.task_id) === normalizedTaskId) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    task.steps.forEach((step) => {
      step.is_completed = true;
      step.completed_at = now;
    });

    task.completed_steps = task.total_steps;
    task.status = "completed";

    return { data: task, error: null };
  }

  const { data: taskData } = await supabase
    .from("tasks")
    .select("total_steps")
    .eq("task_id", normalizedTaskId)
    .limit(1)
    .maybeSingle();

  await supabase
    .from("task_steps")
    .update({
      is_completed: true,
      completed_at: now,
    })
    .eq("task_id", normalizedTaskId);

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_steps: taskData?.total_steps || 0,
      updated_at: now,
    })
    .eq("task_id", normalizedTaskId);

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      task_id: normalizedTaskId,
      status: "completed",
      completed_steps: taskData?.total_steps || 0,
    },
    error: null,
  };
}
