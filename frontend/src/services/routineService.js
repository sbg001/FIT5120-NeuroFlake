import { mockRoutines, mockRoutineItems } from "../data/mockRoutines";

export function getRoutines() {
  return mockRoutines;
}

export function getRoutineItems(routineId) {
  return mockRoutineItems.filter(
    (item) => item.routine_id === Number(routineId)
  );
}

export function getRoutineBlocksWithItems() {
  return mockRoutines.map((routine) => {
    const items = getRoutineItems(routine.routine_id);
    const completed_count = items.filter((item) => item.is_completed).length;

    return {
      ...routine,
      completed_count,
      total_count: items.length,
      items,
    };
  });
}