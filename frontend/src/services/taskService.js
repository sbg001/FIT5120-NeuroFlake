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
  if (!supabase) {
    const mockTask =
      mockTasks.find((task) => task.task_id === Number(taskId)) || null;
    return { data: mockTask, error: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("task_id", Number(taskId))
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const mockTask =
      mockTasks.find((task) => task.task_id === Number(taskId)) || null;
    return { data: mockTask, error: null };
  }

  return { data, error: null };
}

// =======================
// GET TASK STEPS
// =======================
export async function getTaskSteps(taskId) {
  if (!supabase) {
    const mockTask =
      mockTasks.find((task) => task.task_id === Number(taskId)) || null;
    return { data: mockTask ? mockTask.steps : [], error: null };
  }

  const { data, error } = await supabase
    .from("task_steps")
    .select("*")
    .eq("task_id", Number(taskId))
    .order("step_order", { ascending: true });

  if (error || !data || data.length === 0) {
    const mockTask =
      mockTasks.find((task) => task.task_id === Number(taskId)) || null;
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
// COMPLETE STEP
// =======================
export async function completeStep(taskId, stepId) {
  const now = new Date().toISOString();

  if (!supabase) {
    const task =
      mockTasks.find((item) => item.task_id === Number(taskId)) || null;

    if (!task) {
      return { data: null, error: "Task not found." };
    }

    const step = task.steps.find(
      (item) => item.step_id === Number(stepId)
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
    .eq("step_id", Number(stepId))
    .eq("task_id", Number(taskId))
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

// =======================
// COMPLETE TASK
// =======================
export async function completeTask(taskId) {
  const now = new Date().toISOString();

  if (!supabase) {
    const task =
      mockTasks.find((item) => item.task_id === Number(taskId)) || null;

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

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      updated_at: now,
    })
    .eq("task_id", Number(taskId));

  if (error) {
    return { data: null, error };
  }

  return {
    data: { task_id: Number(taskId), status: "completed" },
    error: null,
  };
}