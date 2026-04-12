import { mockEmotionOptions, mockEmotionLogs } from "../data/mockEmotions";
import { supabase } from "../lib/supabase";

export async function getEmotionOptions() {
  return { data: mockEmotionOptions, error: null };
}

export async function getEmotionLogs() {
  const { data, error } = await supabase
    .from("emotion_logs")
    .select("*")
    .order("logged_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { data: mockEmotionLogs, error: null };
  }

  return { data, error: null };
}

export async function saveEmotionSelection({
  child_id,
  emotion_type,
  linked_task_id,
  notes = null,
}) {
  const payload = {
    child_id,
    emotion_type,
    linked_task_id,
    notes,
    logged_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("emotion_logs")
    .insert(payload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      data: {
        emotion_id: Date.now(),
        ...payload,
      },
      error: null,
    };
  }

  return { data, error: null };
}

export async function skipEmotionCheckIn(child_id, linked_task_id) {
  const payload = {
    child_id,
    emotion_type: "skipped",
    linked_task_id,
    notes: null,
    logged_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("emotion_logs")
    .insert(payload)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      data: {
        emotion_id: Date.now(),
        ...payload,
      },
      error: null,
    };
  }

  return { data, error: null };
}