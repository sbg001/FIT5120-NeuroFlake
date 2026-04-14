import { mockRoutines, mockRoutineItems } from "../data/mockRoutines";
import { supabase } from "../lib/supabase";

export async function getRoutines() {
  if (!supabase) {
    return { data: mockRoutines, error: null };
  }

  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return { data: mockRoutines, error: null };
  }

  return { data, error: null };
}

export async function getRoutineItems(routineId) {
  if (!supabase) {
    const items = mockRoutineItems.filter(
      (item) => item.routine_id === Number(routineId)
    );
    return { data: items, error: null };
  }

  const { data, error } = await supabase
    .from("routine_items")
    .select("*")
    .eq("routine_id", Number(routineId))
    .order("item_order", { ascending: true });

  if (error || !data || data.length === 0) {
    const items = mockRoutineItems.filter(
      (item) => item.routine_id === Number(routineId)
    );
    return { data: items, error: null };
  }

  return { data, error: null };
}

export async function getRoutineBlocksWithItems() {
  const routinesResult = await getRoutines();
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
  const payload = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  if (!supabase) {
    const item =
      mockRoutineItems.find(
        (routineItem) => routineItem.item_id === Number(itemId)
      ) || null;

    if (!item) {
      return { data: null, error: "Routine item not found." };
    }

    item.is_completed = isCompleted;
    item.completed_at = payload.completed_at;

    return { data: item, error: null };
  }

  const { data, error } = await supabase
    .from("routine_items")
    .update(payload)
    .eq("item_id", Number(itemId))
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    const item =
      mockRoutineItems.find(
        (routineItem) => routineItem.item_id === Number(itemId)
      ) || null;

    if (!item) {
      return { data: null, error: "Routine item not found." };
    }

    item.is_completed = isCompleted;
    item.completed_at = payload.completed_at;

    return { data: item, error: null };
  }

  return { data, error: null };
}