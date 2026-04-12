export const mockRoutines = [
  {
    routine_id: 1,
    child_id: 1,
    title: "Morning Routine",
    period_name: "morning",
    display_order: 1,
    created_at: "2026-04-12T07:00:00Z",
  },
  {
    routine_id: 2,
    child_id: 1,
    title: "Afternoon Routine",
    period_name: "afternoon",
    display_order: 2,
    created_at: "2026-04-12T12:00:00Z",
  },
  {
    routine_id: 3,
    child_id: 1,
    title: "Evening Routine",
    period_name: "evening",
    display_order: 3,
    created_at: "2026-04-12T18:00:00Z",
  },
];

export const mockRoutineItems = [
  {
    item_id: 1,
    routine_id: 1,
    item_text: "Brush teeth",
    item_order: 1,
    is_completed: true,
    completed_at: "2026-04-12T07:10:00Z",
  },
  {
    item_id: 2,
    routine_id: 1,
    item_text: "Eat breakfast",
    item_order: 2,
    is_completed: false,
    completed_at: null,
  },
  {
    item_id: 3,
    routine_id: 2,
    item_text: "Do homework",
    item_order: 1,
    is_completed: false,
    completed_at: null,
  },
  {
    item_id: 4,
    routine_id: 3,
    item_text: "Pack school bag",
    item_order: 1,
    is_completed: false,
    completed_at: null,
  },
];