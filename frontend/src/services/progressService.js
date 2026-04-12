import {
  mockWeeklySummary,
  mockRecentTasks,
  mockWeeklyChartData,
} from "../data/mockProgress";
import { supabase } from "../lib/supabase";

export async function getWeeklySummary() {
  const { data, error } = await supabase
    .from("progress_summary")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: mockWeeklySummary, error: null };
  }

  return { data, error: null };
}

export async function getRecentTasks() {
  const { data, error } = await supabase
    .from("recent_tasks")
    .select("*")
    .order("completed_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { data: mockRecentTasks, error: null };
  }

  return { data, error: null };
}

export async function getWeeklyChartData() {
  return { data: mockWeeklyChartData, error: null };
}