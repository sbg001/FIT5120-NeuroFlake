import { mockEmotionOptions, mockEmotionLogs } from "../data/mockEmotions";

export function getEmotionOptions() {
  return mockEmotionOptions;
}

export function getEmotionLogs() {
  return mockEmotionLogs;
}

export function saveEmotionSelection({ child_id, emotion_type, linked_task_id, notes = null }) {
  return {
    emotion_id: Date.now(),
    child_id,
    emotion_type,
    logged_at: new Date().toISOString(),
    linked_task_id,
    notes,
  };
}