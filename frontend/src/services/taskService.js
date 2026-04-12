import { mockTasks } from "../data/mockTasks";

export function getTasks() {
  return mockTasks;
}

export function getTaskById(taskId) {
  return mockTasks.find((task) => task.task_id === Number(taskId)) || null;
}

export function getTaskSteps(taskId) {
  const task = getTaskById(taskId);
  return task ? task.steps : [];
}

export function getTodayTask() {
  return mockTasks[0] || null;
}

export async function completeStep(taskId, stepId) {
  const task = getTaskById(taskId);

  if (!task) {
    return { data: null, error: "Task not found." };
  }

  const step = task.steps.find((item) => item.step_id === Number(stepId));

  if (!step) {
    return { data: null, error: "Step not found." };
  }

  step.is_completed = true;
  step.completed_at = new Date().toISOString();

  task.completed_steps = task.steps.filter((item) => item.is_completed).length;
  task.updated_at = new Date().toISOString();

  if (task.completed_steps === task.total_steps) {
    task.status = "completed";
  } else {
    task.status = "in_progress";
  }

  return { data: task, error: null };
}

export async function completeTask(taskId) {
  const task = getTaskById(taskId);

  if (!task) {
    return { data: null, error: "Task not found." };
  }

  task.steps.forEach((step) => {
    if (!step.is_completed) {
      step.is_completed = true;
      step.completed_at = new Date().toISOString();
    }
  });

  task.completed_steps = task.total_steps;
  task.status = "completed";
  task.updated_at = new Date().toISOString();

  return { data: task, error: null };
}