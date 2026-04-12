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