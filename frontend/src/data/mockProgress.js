export const mockWeeklySummary = {
  summary_id: 1,
  child_id: 1,
  week_start_date: "2026-04-06",
  tasks_completed: 5,
  points_earned: 35,
  completion_rate: 83,
  created_at: "2026-04-12T18:00:00Z",
};

export const mockRecentTasks = [
  {
    id: 1,
    child_id: 1,
    task_id: 1,
    task_title: "Get ready for school",
    completed_at: "2026-04-10T09:00:00Z",
    step_count: 3,
    points_earned: 15,
  },
  {
    id: 2,
    child_id: 1,
    task_id: 3,
    task_title: "Brush teeth routine",
    completed_at: "2026-04-11T20:00:00Z",
    step_count: 2,
    points_earned: 10,
  },
];

export const mockWeeklyChartData = [
  { day: "Mon", completed_tasks: 1, points: 5 },
  { day: "Tue", completed_tasks: 1, points: 10 },
  { day: "Wed", completed_tasks: 0, points: 0 },
  { day: "Thu", completed_tasks: 1, points: 5 },
  { day: "Fri", completed_tasks: 1, points: 10 },
  { day: "Sat", completed_tasks: 1, points: 5 },
  { day: "Sun", completed_tasks: 0, points: 0 },
];