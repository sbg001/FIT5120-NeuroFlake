import { mockFocusSessions } from "../data/mockFocus";
import { getTaskById } from "./taskService";

export async function getFocusSessions() {
  return { data: mockFocusSessions, error: null };
}

export async function getCurrentFocusSession(childId) {
  const session =
    mockFocusSessions.find(
      (item) => item.child_id === Number(childId) && item.completed === false
    ) || null;

  return { data: session, error: null };
}

export async function startFocusSession({ child_id, task_id, current_step_id }) {
  const newSession = {
    session_id: Date.now(),
    child_id,
    task_id,
    current_step_id,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_seconds: 0,
    completed: false,
  };

  return { data: newSession, error: null };
}

export async function endFocusSession(sessionId) {
  const session =
    mockFocusSessions.find(
      (item) => item.session_id === Number(sessionId)
    ) || null;

  if (!session) {
    return { data: null, error: "Focus session not found." };
  }

  const endTime = new Date().toISOString();
  const durationSeconds = Math.floor(
    (new Date(endTime).getTime() - new Date(session.start_time).getTime()) / 1000
  );

  const updatedSession = {
    ...session,
    end_time: endTime,
    duration_seconds: durationSeconds,
    completed: true,
  };

  return { data: updatedSession, error: null };
}

export async function getCurrentFocusStep(taskId, stepId) {
  const task = getTaskById(taskId);

  if (!task) {
    return { data: null, error: "Task not found." };
  }

  const step =
    task.steps.find((item) => item.step_id === Number(stepId)) || null;

  if (!step) {
    return { data: null, error: "Step not found." };
  }

  return { data: step, error: null };
}

export async function updateCurrentFocusStep(sessionId, current_step_id) {
  const session =
    mockFocusSessions.find(
      (item) => item.session_id === Number(sessionId)
    ) || null;

  if (!session) {
    return { data: null, error: "Focus session not found." };
  }

  session.current_step_id = current_step_id;

  return { data: session, error: null };
}