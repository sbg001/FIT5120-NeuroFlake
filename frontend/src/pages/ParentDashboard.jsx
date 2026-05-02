import { useCallback, useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import {
  createChildAccount,
  createCommunicationPrompt,
  createParentReward,
  createRoutine,
  createRoutineItem,
  createSupportResource,
  createTask,
  createTaskStep,
  createTrigger,
  deleteParentReward,
  deleteTask,
  generateTaskSteps,
  getAllRewardsForParent,
  getChildProfile,
  getCommunicationPrompts,
  getEmotionLogs,
  getParentProfile,
  getPersonalisedSuggestions,
  getPointsBalance,
  getRoutineBlocksWithItems,
  getSensoryRiskPrediction,
  getSupportResources,
  getTasks,
  getTriggers,
  resetTaskStatus,
  updateParentReward,
  updateChildPassword,
  updateTask,
  updateTaskStepCount,
} from "../services";

const priorityTypeOptions = [
  { value: "importance", label: "Importance" },
  { value: "urgency", label: "Urgency" },
  { value: "happiness", label: "Happiness" },
];

const priorityRankOptions = [
  { value: "1", label: "1 - Low" },
  { value: "2", label: "2 - Medium" },
  { value: "3", label: "3 - High" },
];

function ParentDashboard() {
  const [activeSection, setActiveSection] = useState("tasks");
  const [parentProfile, setParentProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [isLoadingCore, setIsLoadingCore] = useState(true);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [hasLoadedSupport, setHasLoadedSupport] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priorityType, setPriorityType] = useState("");
  const [priorityRank, setPriorityRank] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [editTaskId, setEditTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriorityType, setEditPriorityType] = useState("");
  const [editPriorityRank, setEditPriorityRank] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [deleteTaskId, setDeleteTaskId] = useState("");
  const [deleteTaskMessage, setDeleteTaskMessage] = useState("");

  const [resetTaskId, setResetTaskId] = useState("");
  const [resetTaskMessage, setResetTaskMessage] = useState("");

  const [rewards, setRewards] = useState([]);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardEmoji, setRewardEmoji] = useState("\u{1F381}");
  const [rewardCost, setRewardCost] = useState("");
  const [rewardTheme, setRewardTheme] = useState("");
  const [rewardApproved, setRewardApproved] = useState(true);
  const [rewardMessage, setRewardMessage] = useState("");

  const [editRewardId, setEditRewardId] = useState("");
  const [editRewardTitle, setEditRewardTitle] = useState("");
  const [editRewardEmoji, setEditRewardEmoji] = useState("\u{1F381}");
  const [editRewardCost, setEditRewardCost] = useState("");
  const [editRewardTheme, setEditRewardTheme] = useState("");
  const [editRewardApproved, setEditRewardApproved] = useState(true);
  const [editRewardMessage, setEditRewardMessage] = useState("");

  const [deleteRewardId, setDeleteRewardId] = useState("");
  const [deleteRewardMessage, setDeleteRewardMessage] = useState("");

  const [riskForecast, setRiskForecast] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [triggers, setTriggers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [communicationPrompts, setCommunicationPrompts] = useState([]);
  const [supportResources, setSupportResources] = useState([]);
  const [routineBlocks, setRoutineBlocks] = useState([]);

  const [triggerTitle, setTriggerTitle] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [triggerNotes, setTriggerNotes] = useState("");
  const [triggerMessage, setTriggerMessage] = useState("");

  const [routineTitle, setRoutineTitle] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [routineItemTitle, setRoutineItemTitle] = useState("");
  const [routineItemReminder, setRoutineItemReminder] = useState("");
  const [routineMessage, setRoutineMessage] = useState("");

  const [promptTitle, setPromptTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [promptCategory, setPromptCategory] = useState("");
  const [promptMessage, setPromptMessage] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceCategory, setResourceCategory] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceMessage, setResourceMessage] = useState("");

  const [childAccountName, setChildAccountName] = useState("");
  const [childAccountAge, setChildAccountAge] = useState("");
  const [childAccountUsername, setChildAccountUsername] = useState("");
  const [childAccountPassword, setChildAccountPassword] = useState("");
  const [childAccountMessage, setChildAccountMessage] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [childPasswordConfirm, setChildPasswordConfirm] = useState("");
  const [childPasswordMessage, setChildPasswordMessage] = useState("");

  const [emotionLogs, setEmotionLogs] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [existingRoutineItemTitle, setExistingRoutineItemTitle] = useState("");
  const [existingRoutineItemDescription, setExistingRoutineItemDescription] = useState("");
  const [existingRoutineItemReminder, setExistingRoutineItemReminder] = useState("");
  const [routineItemMessage, setRoutineItemMessage] = useState("");
  const [reminderNotificationMessage, setReminderNotificationMessage] = useState("");

  const hasChildAccount = Boolean(childProfile?.user_id);
  const buildWeeklyEmotionData = (logs) => {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const initialData = dayLabels.map((day) => ({
    day,
    happy: 0,
    overwhelmed: 0,
  }));

  (logs || []).forEach((log) => {
    if (!log.logged_at) return;

    const logDate = new Date(log.logged_at);
    const dayIndex = logDate.getDay();
    const emotionType = String(log.emotion_type || "").toLowerCase();

    if (emotionType === "happy" || emotionType === "good") {
      initialData[dayIndex].happy += 1;
    }

    if (emotionType === "overwhelmed") {
      initialData[dayIndex].overwhelmed += 1;
    }
  });

  const todayIndex = new Date().getDay();

  return [
    ...initialData.slice(todayIndex + 1),
    ...initialData.slice(0, todayIndex + 1),
  ];
};

const weeklyEmotionData = buildWeeklyEmotionData(emotionLogs);

const maxWeeklyEmotionValue = Math.max(
  1,
  ...weeklyEmotionData.map((data) => Math.max(data.happy, data.overwhelmed))
);

const getTodayReminderKey = (itemId) => {
  const today = new Date().toISOString().slice(0, 10);
  return `neuroflake_reminder_${today}_${itemId}`;
};

const showRoutineReminderNotification = useCallback((item, routineTitle) => {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const reminderKey = getTodayReminderKey(item.item_id);

  if (localStorage.getItem(reminderKey)) {
    return;
  }

  new Notification("NeuroFlake routine reminder", {
    body: `${routineTitle}: ${item.title}`,
  });

  localStorage.setItem(reminderKey, "shown");
}, []);

const checkRoutineReminders = useCallback(() => {
  if (!routineBlocks.length || !("Notification" in window)) {
    return;
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  routineBlocks.forEach((routine) => {
    (routine.items || []).forEach((item) => {
      if (!item.reminder_time || item.is_completed) {
        return;
      }

      if (String(item.reminder_time).slice(0, 5) === currentTime) {
        showRoutineReminderNotification(item, routine.title);
      }
    });
  });
}, [routineBlocks, showRoutineReminderNotification]);

  useEffect(() => {
    async function loadCoreDashboardData() {
      setIsLoadingCore(true);

      const [parentResult, childResult] = await Promise.all([
        getParentProfile(),
        getChildProfile(),
      ]);

      const childId = childResult.data?.user_id;

      setParentProfile(parentResult.data);
      setChildProfile(childResult.data);

      const [tasksResult, pointsResult, rewardsResult] = await Promise.all([
        getTasks(childId),
        childId
          ? getPointsBalance(childId)
          : Promise.resolve({ data: { points_balance: 0 }, error: null }),
        getAllRewardsForParent(),
      ]);

      setTasks(tasksResult.data || []);
      setPointsData(pointsResult.data || { points_balance: 0 });
      setRewards(rewardsResult.data || []);
      setIsLoadingCore(false);
    }

    loadCoreDashboardData();
  }, []);

  const loadSupportData = async (childId) => {
    if (!childId) {
      setTriggers([]);
      setSuggestions([]);
      setRoutineBlocks([]);
      setCommunicationPrompts([]);
      setSupportResources([]);
      setEmotionLogs([]);
      setHasLoadedSupport(true);
      return;
    }

    setIsLoadingSupport(true);

    const [
      triggersResult,
      suggestionsResult,
      routinesResult,
      promptsResult,
      resourcesResult,
      emotionLogsResult,
    ] = await Promise.all([
      getTriggers(childId),
      getPersonalisedSuggestions(childId),
      getRoutineBlocksWithItems(childId),
      getCommunicationPrompts(childId),
      getSupportResources(),
      getEmotionLogs(childId),
    ]);

    setTriggers(triggersResult.data || []);
    setSuggestions(suggestionsResult.data || []);
    setRoutineBlocks(routinesResult.data || []);
    setCommunicationPrompts(promptsResult.data || []);
    setSupportResources(resourcesResult.data || []);
    setEmotionLogs(emotionLogsResult.data || []);
    setHasLoadedSupport(true);
    setIsLoadingSupport(false);
  };

  useEffect(() => {
    if (!routineBlocks.length) return;

    checkRoutineReminders();

    const reminderInterval = window.setInterval(() => {
      checkRoutineReminders();
    }, 30000);

    return () => {
      window.clearInterval(reminderInterval);
    };
  }, [routineBlocks, checkRoutineReminders]);

  const refreshTasks = async () => {
    const refreshedTasks = await getTasks(childProfile?.user_id);
    setTasks(refreshedTasks.data || []);
  };

  const refreshRewards = async () => {
    const rewardsResult = await getAllRewardsForParent();
    setRewards(rewardsResult.data || []);
  };

  const refreshEpic6Data = async () => {
    await loadSupportData(childProfile?.user_id);
  };

  async function loadInsights() {
    setIsLoadingInsights(true);

    const todaysTelemetry = {
      hoursSlept: 6.5,
      overwhelmedCount: 2,
      tasksAbandoned: 1,
      tasksCompleted: 3,
    };

    const prediction = await getSensoryRiskPrediction(todaysTelemetry);
    if (prediction) {
      setRiskForecast(prediction);
    }

    setIsLoadingInsights(false);
  }

  const handleCreateTask = async () => {
    setCreateMessage("");

    if (!hasChildAccount) {
      setCreateMessage("Please create a child account before creating tasks.");
      return;
    }

    if (!title || !description || !priorityType || !priorityRank) {
      setCreateMessage("Please complete all task fields.");
      return;
    }

    setIsCreatingTask(true);

    const result = await createTask({
      child_id: childProfile.user_id,
      created_by: parentProfile.user_id,
      title,
      description,
      status: "pending",
      total_steps: 0,
      completed_steps: 0,
      priority_type: priorityType,
      priority_rank: Number(priorityRank),
    });

    if (result.error) {
      setCreateMessage("Failed to create task.");
      setIsCreatingTask(false);
      return;
    }

    const createdTask = result.data;
    const generatedStepsResult = await generateTaskSteps(title, description);
    const generatedSteps = generatedStepsResult.data || [];

    if (generatedSteps.length < 2 || generatedSteps.length > 5) {
      setCreateMessage("Task created, but steps could not be generated.");
      setIsCreatingTask(false);
      await refreshTasks();
      return;
    }

    const stepResults = await Promise.all(
      generatedSteps.map((step, index) =>
        createTaskStep({
          task_id: createdTask.task_id,
          step_order: index + 1,
          step_title: step.step_title,
          step_description: step.step_description,
          visual_hint: step.visual_hint || "",
          example_text: step.example_text || "",
          is_completed: false,
          completed_at: null,
        })
      )
    );

    if (stepResults.some((stepResult) => stepResult.error)) {
      setCreateMessage("Task created, but some steps could not be saved.");
      setIsCreatingTask(false);
      await refreshTasks();
      return;
    }

    await updateTaskStepCount(createdTask.task_id);
    await refreshTasks();

    setTitle("");
    setDescription("");
    setPriorityType("");
    setPriorityRank("");
    setCreateMessage(
      generatedStepsResult.usedFallback
        ? "Task created with simple local steps. The AI helper was not available."
        : "Task created with smaller steps."
    );
    setIsCreatingTask(false);
  };

  const handleSelectEditTask = (taskId) => {
    setEditTaskId(taskId);

    const selectedTask = tasks.find((task) => String(task.task_id) === String(taskId));
    if (!selectedTask) return;

    setEditTitle(selectedTask.title || "");
    setEditDescription(selectedTask.description || "");
    setEditPriorityType(selectedTask.priority_type || "");
    setEditPriorityRank(String(selectedTask.priority_rank || ""));
    setEditMessage("");
  };

  const handleUpdateTask = async () => {
    setEditMessage("");

    if (!editTaskId || !editTitle || !editDescription || !editPriorityType || !editPriorityRank) {
      setEditMessage("Please complete all edit task fields.");
      return;
    }

    const result = await updateTask(editTaskId, {
      title: editTitle,
      description: editDescription,
      priority_type: editPriorityType,
      priority_rank: Number(editPriorityRank),
    });

    if (result.error) {
      setEditMessage("Failed to update task.");
      return;
    }

    await refreshTasks();
    setEditMessage("Task updated successfully.");
  };

  const handleDeleteTask = async () => {
    setDeleteTaskMessage("");

    if (!deleteTaskId) {
      setDeleteTaskMessage("Please select a task to delete.");
      return;
    }

    const result = await deleteTask(deleteTaskId);

    if (result.error) {
      setDeleteTaskMessage("Failed to delete task.");
      return;
    }

    await refreshTasks();
    setDeleteTaskId("");
    setDeleteTaskMessage("Task deleted successfully.");
  };

  const handleResetTask = async () => {
    setResetTaskMessage("");

    if (!resetTaskId) {
      setResetTaskMessage("Please select a task to reset.");
      return;
    }

    const result = await resetTaskStatus(resetTaskId);

    if (result.error) {
      setResetTaskMessage("Failed to reset task.");
      return;
    }

    await refreshTasks();
    setResetTaskMessage("Task reset successfully.");
  };

  const handleCreateReward = async () => {
    setRewardMessage("");

    if (!rewardTitle || !rewardCost) {
      setRewardMessage("Please complete the required reward fields.");
      return;
    }

    const result = await createParentReward({
      title: rewardTitle,
      emoji: rewardEmoji,
      cost: Number(rewardCost),
      theme: rewardTheme,
      approved: rewardApproved,
    });

    if (result.error) {
      setRewardMessage("Failed to create reward.");
      return;
    }

    await refreshRewards();
    setRewardTitle("");
    setRewardEmoji("\u{1F381}");
    setRewardCost("");
    setRewardTheme("");
    setRewardApproved(true);
    setRewardMessage("Reward created successfully.");
  };

  const handleCreateChildAccount = async () => {
    setChildAccountMessage("");

    if (hasChildAccount) {
      setChildAccountMessage("This parent account already has a child profile.");
      return;
    }

    if (
      !childAccountName ||
      !childAccountAge ||
      !childAccountUsername ||
      !childAccountPassword
    ) {
      setChildAccountMessage("Please complete all child account fields.");
      return;
    }

    const result = await createChildAccount({
      parentId: parentProfile.user_id,
      name: childAccountName,
      age: childAccountAge,
      username: childAccountUsername,
      password: childAccountPassword,
    });

    if (result.error) {
      setChildAccountMessage(result.error);
      return;
    }

    setChildProfile(result.data);
    localStorage.setItem("current_child_id", String(result.data.user_id));
    setPointsData({ points_balance: 0 });
    setTasks([]);
    setHasLoadedSupport(false);
    setTriggers([]);
    setSuggestions([]);
    setRoutineBlocks([]);
    setCommunicationPrompts([]);
    setSupportResources([]);
    setEmotionLogs([]);
    setChildAccountName("");
    setChildAccountAge("");
    setChildAccountUsername("");
    setChildAccountPassword("");
    setChildAccountMessage(
      "Child account created successfully. The child can now sign in with their username and password."
    );
  };

  const handleUpdateChildPassword = async () => {
    setChildPasswordMessage("");

    if (!hasChildAccount) {
      setChildPasswordMessage("Create a child profile first.");
      return;
    }

    if (!childPassword || !childPasswordConfirm) {
      setChildPasswordMessage("Please enter and confirm the new password.");
      return;
    }

    if (childPassword !== childPasswordConfirm) {
      setChildPasswordMessage("The passwords do not match.");
      return;
    }

    const result = await updateChildPassword({
      parentId: parentProfile.user_id,
      childId: childProfile.user_id,
      password: childPassword,
    });

    if (result.error) {
      setChildPasswordMessage(result.error);
      return;
    }

    setChildPassword("");
    setChildPasswordConfirm("");
    setChildPasswordMessage("Child password updated successfully.");
  };

  const handleSelectEditReward = (rewardId) => {
    setEditRewardId(rewardId);

    const reward = rewards.find((item) => String(item.id) === String(rewardId));
    if (!reward) return;

    setEditRewardTitle(reward.title || "");
    setEditRewardEmoji(reward.emoji || "\u{1F381}");
    setEditRewardCost(String(reward.cost || ""));
    setEditRewardTheme(reward.theme || "");
    setEditRewardApproved(reward.approved ?? true);
    setEditRewardMessage("");
  };

  const handleUpdateReward = async () => {
    setEditRewardMessage("");

    if (!editRewardId || !editRewardTitle || !editRewardCost) {
      setEditRewardMessage("Please complete the required edit reward fields.");
      return;
    }

    const result = await updateParentReward(editRewardId, {
      title: editRewardTitle,
      emoji: editRewardEmoji,
      cost: Number(editRewardCost),
      theme: editRewardTheme,
      approved: editRewardApproved,
    });

    if (result.error) {
      setEditRewardMessage("Failed to update reward.");
      return;
    }

    await refreshRewards();
    setEditRewardMessage("Reward updated successfully.");
  };

  const handleDeleteReward = async () => {
    setDeleteRewardMessage("");

    if (!deleteRewardId) {
      setDeleteRewardMessage("Please select a reward to delete.");
      return;
    }

    const result = await deleteParentReward(deleteRewardId);

    if (result.error) {
      setDeleteRewardMessage("Failed to delete reward.");
      return;
    }

    await refreshRewards();
    setDeleteRewardId("");
    setDeleteRewardMessage("Reward deleted successfully.");
  };

  const handleCreateTrigger = async () => {
    setTriggerMessage("");

    if (!hasChildAccount) {
      setTriggerMessage("Please create a child account before saving triggers.");
      return;
    }

    if (!triggerTitle || !triggerType) {
      setTriggerMessage("Please complete the trigger title and type.");
      return;
    }

    const result = await createTrigger({
      child_id: childProfile.user_id,
      trigger_title: triggerTitle,
      trigger_type: triggerType,
      notes: triggerNotes,
    });

    if (result.error) {
      setTriggerMessage(result.error);
      return;
    }

    setTriggerTitle("");
    setTriggerType("");
    setTriggerNotes("");
    setTriggerMessage("Trigger saved successfully.");
    await refreshEpic6Data();
  };

  const handleCreateRoutine = async () => {
    setRoutineMessage("");

    if (!hasChildAccount) {
      setRoutineMessage("Please create a child account before creating routines.");
      return;
    }

    if (!routineTitle || !routineItemTitle) {
      setRoutineMessage("Please complete the routine and first item title.");
      return;
    }

    const routineResult = await createRoutine({
      child_id: childProfile.user_id,
      title: routineTitle,
      description: routineDescription,
      display_order: routineBlocks.length + 1,
    });

    if (routineResult.error) {
      setRoutineMessage(routineResult.error);
      return;
    }

    const itemResult = await createRoutineItem({
      routine_id: routineResult.data.routine_id,
      item_order: 1,
      title: routineItemTitle,
      description: routineDescription,
      reminder_time: routineItemReminder,
    });

    if (itemResult.error) {
      setRoutineMessage("Routine created, but the reminder item could not be saved.");
      await refreshEpic6Data();
      return;
    }

    setRoutineTitle("");
    setRoutineDescription("");
    setRoutineItemTitle("");
    setRoutineItemReminder("");
    setRoutineMessage("Routine and reminder saved successfully.");
    await refreshEpic6Data();
  };
  const handleCreateRoutineItemForExistingRoutine = async () => {
    setRoutineItemMessage("");

    if (!selectedRoutineId || !existingRoutineItemTitle) {
      setRoutineItemMessage("Please select a routine and enter an item title.");
      return;
    }

    const selectedRoutine = routineBlocks.find(
      (routine) => String(routine.routine_id) === String(selectedRoutineId)
    );

    const nextOrder = (selectedRoutine?.items?.length || 0) + 1;

    const result = await createRoutineItem({
      routine_id: selectedRoutineId,
      item_order: nextOrder,
      title: existingRoutineItemTitle,
      description: existingRoutineItemDescription,
      reminder_time: existingRoutineItemReminder,
    });

    if (result.error) {
      setRoutineItemMessage(result.error);
      return;
    }

    setExistingRoutineItemTitle("");
    setExistingRoutineItemDescription("");
    setExistingRoutineItemReminder("");
    setRoutineItemMessage("Routine item and reminder saved successfully.");
    await refreshEpic6Data();
  };

  const handleEnableReminderNotifications = async () => {
    setReminderNotificationMessage("");

    if (!("Notification" in window)) {
      setReminderNotificationMessage("This browser does not support notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      setReminderNotificationMessage("Reminder notifications are already enabled.");
      checkRoutineReminders();
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setReminderNotificationMessage("Reminder notifications enabled for this browser.");
      checkRoutineReminders();
      return;
    }

    setReminderNotificationMessage("Notifications were not enabled.");
  };
  const handleCreatePrompt = async () => {
    setPromptMessage("");

    if (!hasChildAccount) {
      setPromptMessage("Please create a child account before creating prompts.");
      return;
    }

    if (!promptTitle || !promptText) {
      setPromptMessage("Please complete the prompt title and text.");
      return;
    }

    const result = await createCommunicationPrompt({
      child_id: childProfile.user_id,
      title: promptTitle,
      prompt_text: promptText,
      category: promptCategory || "general",
    });

    if (result.error) {
      setPromptMessage(result.error);
      return;
    }

    setPromptTitle("");
    setPromptText("");
    setPromptCategory("");
    setPromptMessage("Communication prompt saved successfully.");
    await refreshEpic6Data();
  };

  const handleCreateResource = async () => {
    setResourceMessage("");

    if (!resourceTitle || !resourceCategory || !resourceDescription) {
      setResourceMessage("Please complete the resource title, category, and description.");
      return;
    }

    const result = await createSupportResource({
      title: resourceTitle,
      category: resourceCategory,
      description: resourceDescription,
      url: resourceUrl,
    });

    if (result.error) {
      setResourceMessage(result.error);
      return;
    }

    setResourceTitle("");
    setResourceCategory("");
    setResourceDescription("");
    setResourceUrl("");
    setResourceMessage("Support resource saved successfully.");
    await refreshEpic6Data();
  };

  if (!parentProfile || !pointsData || isLoadingCore) {
    return (
      <section className="page-section">
        <p>Loading dashboard...</p>
      </section>
    );
  }

  const childTasks = hasChildAccount
    ? tasks.filter((task) => String(task.child_id) === String(childProfile.user_id))
    : [];
  const activeTasks = childTasks.filter((task) => String(task.status) !== "completed");
  const completedTasks = childTasks.filter((task) => String(task.status) === "completed");
  const totalTasks = childTasks.length;
  const totalRewards = rewards.length;
  const totalPoints = pointsData.points_balance ?? 0;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const averageSteps =
    totalTasks > 0
      ? Math.round(
          childTasks.reduce((sum, task) => sum + Number(task.total_steps || 0), 0) / totalTasks
        )
      : 0;
  const featuredTask = activeTasks[0] || completedTasks[0] || null;

  const getStatusConfig = (task) => {
    const completed = String(task.status) === "completed";
    const totalSteps = Math.max(Number(task.total_steps || 0), 1);
    const doneSteps = Number(task.completed_steps || 0);

    if (completed || doneSteps >= totalSteps) {
      return {
        label: "Completed",
        tone: "mint",
        detail: "Finished and ready to celebrate",
      };
    }

    if (doneSteps > 0) {
      return {
        label: "In progress",
        tone: "sky",
        detail: `${doneSteps} of ${totalSteps} steps done`,
      };
    }

    return {
      label: "Ready",
      tone: "warm",
      detail: `${totalSteps} steps prepared`,
    };
  };

  const renderTaskOption = (task) =>
    `${task.title} (${getStatusConfig(task).label.toLowerCase()})`;

  const riskTone =
    riskForecast?.risk_level === "Low"
      ? "mint"
      : riskForecast?.risk_level === "Medium"
        ? "warm"
        : "default";

  const triggerCounts = triggers.reduce((counts, trigger) => {
    const key = trigger.trigger_type || trigger.trigger_title || "Other";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const repeatedTriggerEntry = Object.entries(triggerCounts).sort(
    (first, second) => second[1] - first[1]
  )[0];

  const repeatedTriggerLabel = repeatedTriggerEntry
    ? `${repeatedTriggerEntry[0]} (${repeatedTriggerEntry[1]} times)`
    : "No repeated trigger yet";
  const shouldShowChildSetup = !isLoadingCore && Boolean(parentProfile) && !hasChildAccount;

  return (
    <section className="page-section parent-dashboard">
      {shouldShowChildSetup ? (
        <div className="parent-setup-modal" role="dialog" aria-modal="true" aria-labelledby="child-setup-title">
          <div className="parent-setup-modal__backdrop" />
          <Card className="parent-setup-modal__panel" variant="glow">
            <div className="parent-setup-modal__content">
              <div className="parent-setup-modal__hero" aria-hidden="true">
                {"\u{1F476}"}
              </div>
              <div className="parent-setup-modal__copy">
                <p className="eyebrow">First Step</p>
                <h3 id="child-setup-title">Create your child profile</h3>
                <p className="page-text">
                  Add one child account so tasks, rewards, and support tools stay simple and easy to manage.
                </p>
              </div>

              <div className="parent-setup-modal__form">
                <input
                  type="text"
                  placeholder="Child name"
                  value={childAccountName}
                  onChange={(event) => setChildAccountName(event.target.value)}
                />
                <input
                  type="number"
                  placeholder="Child age"
                  value={childAccountAge}
                  onChange={(event) => setChildAccountAge(event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Child username"
                  value={childAccountUsername}
                  onChange={(event) => setChildAccountUsername(event.target.value)}
                />
                <input
                  type="password"
                  placeholder="Child password"
                  value={childAccountPassword}
                  onChange={(event) => setChildAccountPassword(event.target.value)}
                />

                {childAccountMessage ? (
                  <p className="parent-dashboard__message">{childAccountMessage}</p>
                ) : null}

                <Button onClick={handleCreateChildAccount}>
                  Save Child Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <PageHeader
        eyebrow="Parent Dashboard"
        title={`Welcome, ${parentProfile.name}`}
        description={
          hasChildAccount
            ? `A calm control center for managing ${childProfile.name}'s tasks, progress, rewards, and support insights.`
            : "Create a child account first to start managing tasks, rewards, and support insights."
        }
      />

      <div className="parent-dashboard__hero-grid">
        <Card className="parent-dashboard__hero-card" variant="glow">
          <div className="parent-dashboard__hero-top">
            <div>
              <p className="eyebrow">Child Progress Summary</p>
              <h3>{childProfile?.name || "Your child"}'s week at a glance</h3>
            </div>
            <Badge tone="warm">{activeTasks.length} active tasks</Badge>
          </div>

          <div className="parent-dashboard__hero-metrics">
            <div className="parent-dashboard__metric-card">
              <span>Completion</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="parent-dashboard__metric-card">
              <span>Reward points</span>
              <strong>{totalPoints}</strong>
            </div>
            <div className="parent-dashboard__metric-card">
              <span>Average steps</span>
              <strong>{averageSteps}</strong>
            </div>
          </div>

          <div className="parent-dashboard__hero-progress">
            <div className="parent-dashboard__hero-progress-label">
              <span>{completedTasks.length} completed tasks</span>
              <span>{totalTasks} total tasks</span>
            </div>
            <ProgressBar
              value={completionPercent}
              max={100}
              label="Child task completion progress"
            />
          </div>
        </Card>

        <Card className="parent-dashboard__snapshot-card" variant="soft">
          <p className="eyebrow">Focus Snapshot</p>
          {featuredTask ? (
            <div className="parent-dashboard__snapshot-body">
              <div className="parent-dashboard__snapshot-row">
                <h3>{featuredTask.title}</h3>
                <Badge tone={getStatusConfig(featuredTask).tone}>
                  {getStatusConfig(featuredTask).label}
                </Badge>
              </div>
              <p className="page-text">
                {featuredTask.description || getStatusConfig(featuredTask).detail}
              </p>
              <p className="parent-dashboard__snapshot-note">
                {getStatusConfig(featuredTask).detail}
              </p>
            </div>
          ) : (
            <div className="parent-dashboard__empty-state parent-dashboard__empty-state--compact">
              <div className="parent-dashboard__empty-icon" aria-hidden="true">
                {"\u{1F33F}"}
              </div>
              <p>No tasks yet. Create the first one to start building structure.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="parent-dashboard__summary-grid">
        <Card className="parent-dashboard__summary-card" variant="soft">
          <span>Task overview</span>
          <strong>{totalTasks}</strong>
          <p>{activeTasks.length} active and {completedTasks.length} completed</p>
        </Card>
        <Card className="parent-dashboard__summary-card" variant="soft">
          <span>Reward management</span>
          <strong>{totalRewards}</strong>
          <p>{rewards.filter((reward) => reward.approved).length} approved rewards ready</p>
        </Card>
        <Card className="parent-dashboard__summary-card" variant="soft">
          <span>Support flow</span>
          <strong>{childProfile?.name || "No child yet"}</strong>
          <p>Tasks are broken into small steps after creation</p>
        </Card>
      </div>

      <Card className="parent-dashboard__tabs-card" variant="default">
        <div className="parent-dashboard__tabs">
          {[
            { id: "tasks", label: "Tasks", note: "Create, edit, reset, and review" },
            { id: "rewards", label: "Rewards", note: "Control the reward catalog" },
            { id: "insights", label: "Insights", note: "Triggers and personalised suggestions" },
            { id: "support", label: "Support", note: "Routines, prompts, and resources" },
          ].map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                if (section.id === "insights" && !riskForecast) {
                  loadInsights();
                }
                if (
                  (section.id === "insights" || section.id === "support") &&
                  !hasLoadedSupport &&
                  !isLoadingCore
                ) {
                  loadSupportData(childProfile?.user_id);
                }
              }}
              className={[
                "parent-dashboard__tab",
                activeSection === section.id ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <strong>{section.label}</strong>
              <span>{section.note}</span>
            </button>
          ))}
        </div>
      </Card>

      {activeSection === "tasks" ? (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Task Library</p>
                  <h3>Current assignments</h3>
                </div>
                <Badge tone="sky">{totalTasks} tasks</Badge>
              </div>

              {childTasks.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {childTasks.map((task) => {
                    const totalSteps = Math.max(Number(task.total_steps || 0), 1);
                    const doneSteps = Math.min(Number(task.completed_steps || 0), totalSteps);
                    const status = getStatusConfig(task);

                    return (
                      <div key={task.task_id} className="parent-dashboard__task-item">
                        <div className="parent-dashboard__task-item-top">
                          <div>
                            <h4>{task.title}</h4>
                            <p>{task.description || "No description yet."}</p>
                          </div>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>

                        <div className="parent-dashboard__task-meta">
                          <span>{status.detail}</span>
                          <span>
                            {task.priority_type || "Priority"} {task.priority_rank || "-"}
                          </span>
                        </div>

                        <ProgressBar
                          value={doneSteps}
                          max={totalSteps}
                          label={`${task.title} progress`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F4DD}"}
                  </div>
                  <h4>No tasks yet</h4>
                  <p>Create a task and NeuroFlake will break it into smaller steps.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Task Controls</p>
                  <h3>Reset or remove with care</h3>
                </div>
              </div>

              <div className="parent-dashboard__control-grid">
                <div className="parent-dashboard__form-card">
                  <h4>Reset task status</h4>
                  <p className="page-text">
                    Make a task pending again and clear completed steps.
                  </p>
                  <div className="parent-dashboard__form-grid">
                    <select value={resetTaskId} onChange={(e) => setResetTaskId(e.target.value)}>
                      <option value="">Select task to reset</option>
                      {childTasks.map((task) => (
                        <option key={task.task_id} value={task.task_id}>
                          {renderTaskOption(task)}
                        </option>
                      ))}
                    </select>
                    {resetTaskMessage ? (
                      <p className="parent-dashboard__message">{resetTaskMessage}</p>
                    ) : null}
                    <Button variant="secondary" onClick={handleResetTask}>
                      Reset Task
                    </Button>
                  </div>
                </div>

                <div className="parent-dashboard__form-card">
                  <h4>Delete task</h4>
                  <p className="page-text">
                    Removing a task also removes its saved step list.
                  </p>
                  <div className="parent-dashboard__form-grid">
                    <select value={deleteTaskId} onChange={(e) => setDeleteTaskId(e.target.value)}>
                      <option value="">Select task to delete</option>
                      {childTasks.map((task) => (
                        <option key={task.task_id} value={task.task_id}>
                          {renderTaskOption(task)}
                        </option>
                      ))}
                    </select>
                    {deleteTaskMessage ? (
                      <p className="parent-dashboard__message">{deleteTaskMessage}</p>
                    ) : null}
                    <Button variant="secondary" onClick={handleDeleteTask}>
                      Delete Task
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Child Sign-In</p>
                  <h3>Keep access simple</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  value={childProfile?.username || ""}
                  readOnly
                  aria-label="Child username"
                  placeholder="Child username"
                />
                <input
                  type="password"
                  placeholder="New child password"
                  value={childPassword}
                  onChange={(e) => setChildPassword(e.target.value)}
                  disabled={!hasChildAccount}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={childPasswordConfirm}
                  onChange={(e) => setChildPasswordConfirm(e.target.value)}
                  disabled={!hasChildAccount}
                />
                {childPasswordMessage ? (
                  <p className="parent-dashboard__message">{childPasswordMessage}</p>
                ) : null}
                <Button onClick={handleUpdateChildPassword} disabled={!hasChildAccount}>
                  Update Child Password
                </Button>
              </div>
            </Card>

            <Card
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Create Task</p>
                  <h3>Plan a calm next step</h3>
                </div>
                <Badge tone="warm">2 to 5 steps added</Badge>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                <select value={priorityType} onChange={(e) => setPriorityType(e.target.value)}>
                  <option value="">Select priority type</option>
                  {priorityTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select value={priorityRank} onChange={(e) => setPriorityRank(e.target.value)}>
                  <option value="">Select priority rank</option>
                  {priorityRankOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {createMessage ? (
                  <p className="parent-dashboard__message">{createMessage}</p>
                ) : null}
                <Button onClick={handleCreateTask} disabled={isCreatingTask || !hasChildAccount}>
                  {isCreatingTask ? "Creating Steps..." : "Create Task With Steps"}
                </Button>
              </div>
            </Card>

            <Card className="parent-dashboard__form-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Edit Task</p>
                  <h3>Adjust the plan</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <select value={editTaskId} onChange={(e) => handleSelectEditTask(e.target.value)}>
                  <option value="">Select task to edit</option>
                  {childTasks.map((task) => (
                    <option key={task.task_id} value={task.task_id}>
                      {renderTaskOption(task)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Edit task title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  placeholder="Edit task description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
                <select
                  value={editPriorityType}
                  onChange={(e) => setEditPriorityType(e.target.value)}
                >
                  <option value="">Select priority type</option>
                  {priorityTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={editPriorityRank}
                  onChange={(e) => setEditPriorityRank(e.target.value)}
                >
                  <option value="">Select priority rank</option>
                  {priorityRankOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {editMessage ? (
                  <p className="parent-dashboard__message">{editMessage}</p>
                ) : null}
                <Button onClick={handleUpdateTask}>Update Task</Button>
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === "rewards" ? (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Reward Management</p>
                  <h3>Available rewards</h3>
                </div>
                <Badge tone="warm">
                  {rewards.filter((reward) => reward.approved).length} approved
                </Badge>
              </div>

              {rewards.length > 0 ? (
                <div className="parent-dashboard__reward-grid">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="parent-dashboard__reward-item">
                      <div className="parent-dashboard__reward-top">
                        <div className="parent-dashboard__reward-icon" aria-hidden="true">
                          {reward.emoji || "\u{1F381}"}
                        </div>
                        <Badge tone={reward.approved ? "mint" : "default"}>
                          {reward.approved ? "Approved" : "Hidden"}
                        </Badge>
                      </div>
                      <h4>{reward.title}</h4>
                      <p>{reward.theme || "Custom reward"}</p>
                      <div className="parent-dashboard__reward-meta">
                        <span>{reward.cost} points</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F381}"}
                  </div>
                  <h4>No rewards yet</h4>
                  <p>Add a reward so points can connect to something meaningful.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Reward Controls</p>
                  <h3>Remove old options when needed</h3>
                </div>
              </div>

              <div className="parent-dashboard__control-grid">
                <div className="parent-dashboard__form-card">
                  <h4>Delete reward</h4>
                  <p className="page-text">
                    Use this when a reward is no longer part of the routine.
                  </p>
                  <div className="parent-dashboard__form-grid">
                    <select
                      value={deleteRewardId}
                      onChange={(e) => setDeleteRewardId(e.target.value)}
                    >
                      <option value="">Select reward to delete</option>
                      {rewards.map((reward) => (
                        <option key={reward.id} value={reward.id}>
                          {reward.title}
                        </option>
                      ))}
                    </select>
                    {deleteRewardMessage ? (
                      <p className="parent-dashboard__message">{deleteRewardMessage}</p>
                    ) : null}
                    <Button variant="secondary" onClick={handleDeleteReward}>
                      Delete Reward
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Create Reward</p>
                  <h3>Add a clear motivation</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Reward title"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Emoji"
                  value={rewardEmoji}
                  onChange={(e) => setRewardEmoji(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Points cost"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Theme"
                  value={rewardTheme}
                  onChange={(e) => setRewardTheme(e.target.value)}
                />
                <select
                  value={rewardApproved ? "true" : "false"}
                  onChange={(e) => setRewardApproved(e.target.value === "true")}
                >
                  <option value="true">Approved</option>
                  <option value="false">Not approved</option>
                </select>
                {rewardMessage ? (
                  <p className="parent-dashboard__message">{rewardMessage}</p>
                ) : null}
                <Button onClick={handleCreateReward}>Create Reward</Button>
              </div>
            </Card>

            <Card className="parent-dashboard__form-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Edit Reward</p>
                  <h3>Keep the catalog current</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <select
                  value={editRewardId}
                  onChange={(e) => handleSelectEditReward(e.target.value)}
                >
                  <option value="">Select reward to edit</option>
                  {rewards.map((reward) => (
                    <option key={reward.id} value={reward.id}>
                      {reward.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Edit reward title"
                  value={editRewardTitle}
                  onChange={(e) => setEditRewardTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Edit emoji"
                  value={editRewardEmoji}
                  onChange={(e) => setEditRewardEmoji(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Edit points cost"
                  value={editRewardCost}
                  onChange={(e) => setEditRewardCost(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Edit theme"
                  value={editRewardTheme}
                  onChange={(e) => setEditRewardTheme(e.target.value)}
                />
                <select
                  value={editRewardApproved ? "true" : "false"}
                  onChange={(e) => setEditRewardApproved(e.target.value === "true")}
                >
                  <option value="true">Approved</option>
                  <option value="false">Not approved</option>
                </select>
                {editRewardMessage ? (
                  <p className="parent-dashboard__message">{editRewardMessage}</p>
                ) : null}
                <Button onClick={handleUpdateReward}>Update Reward</Button>
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === "insights" ? (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Behavioral Insights</p>
                  <h3>Sensory Overload Forecast</h3>
                </div>
                {isLoadingInsights ? (
                  <Badge tone="default">Analyzing</Badge>
                ) : riskForecast ? (
                  <Badge tone={riskTone}>{riskForecast.risk_level} risk</Badge>
                ) : (
                  <Badge tone="default">Engine offline</Badge>
                )}
              </div>

              <p className="page-text">
                AI-powered support guidance based on sleep, task completion, and
                emotion-related telemetry.
              </p>

              {isLoadingSupport ? (
                <p className="page-text">Loading support insights...</p>
              ) : null}

              {riskForecast ? (
                <div className="parent-dashboard__insight-callout">
                  <strong>AI advisory</strong>
                  <p>{riskForecast.advisory_text}</p>
                </div>
              ) : (
                <div className="parent-dashboard__empty-state parent-dashboard__empty-state--compact">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F9E0}"}
                  </div>
                  <p>
                    {isLoadingInsights
                      ? "Loading today's insight forecast."
                      : "No insight forecast is available yet."}
                  </p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Weekly Emotional Regulation</p>
                  <h3>Pattern snapshot</h3>
                </div>
              </div>

              {isLoadingSupport ? (
                <p className="page-text">Loading emotion patterns...</p>
              ) : null}

              <p className="page-text">
                Tracking reported happy moments and overwhelmed moments can help
                surface gentle patterns over time.
              </p>

              <div className="parent-dashboard__legend">
                <span className="parent-dashboard__legend-item">
                  <i className="parent-dashboard__legend-dot parent-dashboard__legend-dot--happy" />
                  Happy / Good
                </span>
                <span className="parent-dashboard__legend-item">
                  <i className="parent-dashboard__legend-dot parent-dashboard__legend-dot--overwhelmed" />
                  Overwhelmed
                </span>
              </div>


              <div className="parent-dashboard__chart">
                {weeklyEmotionData.map((data) => (
                  <div key={data.day} className="parent-dashboard__chart-day">
                    <div className="parent-dashboard__chart-bars">
                      <div
                        className="parent-dashboard__chart-bar parent-dashboard__chart-bar--happy"
                        style={{ height: `${(data.happy / maxWeeklyEmotionValue) * 100}%` }}
                        aria-label={`${data.day} happy count ${data.happy}`}
                      />
                      <div
                        className="parent-dashboard__chart-bar parent-dashboard__chart-bar--overwhelmed"
                        style={{ height: `${(data.overwhelmed / maxWeeklyEmotionValue) * 100}%` }}
                        aria-label={`${data.day} overwhelmed count ${data.overwhelmed}`}
                      />
                    </div>
                    <span>{data.day}</span>
                  </div>
                ))}
              </div>
              <p className="page-text">
                This chart is calculated from saved emotion check-ins.
              </p>
            </Card>

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Trigger Tracking</p>
                  <h3>Recorded friction points</h3>
                </div>
                <Badge tone="warm">{triggers.length} triggers</Badge>
              </div>

              <p className="page-text">
                Repeated trigger: {repeatedTriggerLabel}
              </p>

              {triggers.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {triggers.map((trigger) => (
                    <div key={trigger.trigger_id} className="parent-dashboard__task-item">
                      <div className="parent-dashboard__task-item-top">
                        <div>
                          <h4>{trigger.trigger_title}</h4>
                          <p>{trigger.notes || "No notes added."}</p>
                        </div>
                        <Badge tone="sky">{trigger.trigger_type}</Badge>
                      </div>
                      <div className="parent-dashboard__task-meta">
                        <span>
                          {trigger.logged_at
                            ? new Date(trigger.logged_at).toLocaleString()
                            : "Recently added"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F50E}"}
                  </div>
                  <h4>No triggers yet</h4>
                  <p>Add a trigger to start seeing repeated patterns.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Personalised Suggestions</p>
                  <h3>Actionable parent guidance</h3>
                </div>
                <Badge tone="mint">{suggestions.length} suggestions</Badge>
              </div>

              {suggestions.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.title}-${index}`}
                      className="parent-dashboard__task-item"
                    >
                      <div className="parent-dashboard__task-item-top">
                        <div>
                          <h4>{suggestion.title}</h4>
                          <p>{suggestion.text}</p>
                        </div>
                        <Badge tone="warm">{suggestion.source || "guidance"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F4A1}"}
                  </div>
                  <h4>No suggestions yet</h4>
                  <p>Add triggers or emotion logs to generate support guidance.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">How To Use This</p>
                  <h3>Support, not alarm</h3>
                </div>
              </div>
              <div className="parent-dashboard__insight-notes">
                <p>Look for repeated friction, not one hard moment.</p>
                <p>Use forecasts to simplify the next task before stress grows.</p>
                <p>Pair emotional patterns with routine changes and reward timing.</p>
              </div>
              <Button variant="secondary" onClick={loadInsights} disabled={isLoadingInsights}>
                {isLoadingInsights ? "Refreshing..." : "Refresh Insights"}
              </Button>
            </Card>

            <Card
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Trigger</p>
                  <h3>Log a support signal</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Trigger title, e.g. Loud noise"
                  value={triggerTitle}
                  onChange={(event) => setTriggerTitle(event.target.value)}
                />

                <select
                  value={triggerType}
                  onChange={(event) => setTriggerType(event.target.value)}
                >
                  <option value="">Select trigger type</option>
                  <option value="noise">Noise</option>
                  <option value="transition">Transition</option>
                  <option value="routine change">Routine change</option>
                  <option value="task difficulty">Task difficulty</option>
                  <option value="sensory overload">Sensory overload</option>
                  <option value="other">Other</option>
                </select>

                <textarea
                  placeholder="Notes"
                  value={triggerNotes}
                  onChange={(event) => setTriggerNotes(event.target.value)}
                  rows={4}
                />

                {triggerMessage ? (
                  <p className="parent-dashboard__message">{triggerMessage}</p>
                ) : null}

                <Button onClick={handleCreateTrigger} disabled={!hasChildAccount}>
                  Save Trigger
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            {isLoadingSupport ? (
              <Card className="parent-dashboard__collection-card" variant="soft">
                <div className="parent-dashboard__section-header">
                  <div>
                    <p className="eyebrow">Support Tools</p>
                    <h3>Loading routines, prompts, and resources</h3>
                  </div>
                </div>
                <p className="page-text">
                  We are getting the support tools ready so parents can see only the most useful information.
                </p>
              </Card>
            ) : null}

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Routine Planner</p>
                  <h3>Saved routines and reminders</h3>
                </div>
                <Badge tone="sky">{routineBlocks.length} routines</Badge>
              </div>

              {routineBlocks.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {routineBlocks.map((routine) => (
                    <div key={routine.routine_id} className="parent-dashboard__task-item">
                      <div className="parent-dashboard__task-item-top">
                        <div>
                          <h4>{routine.title}</h4>
                          <p>{routine.description || "No description added."}</p>
                        </div>
                        <Badge tone="mint">
                          {routine.completed_count || 0}/{routine.total_count || 0}
                        </Badge>
                      </div>

                      {routine.items?.length > 0 ? (
                        <div className="parent-dashboard__task-list">
                          {routine.items.map((item) => (
                            <div key={item.item_id} className="parent-dashboard__task-meta">
                              <span>{item.title}</span>
                              <span>
                                {item.reminder_time
                                  ? `Reminder: ${item.reminder_time}`
                                  : "No reminder"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="page-text">No routine items yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F4C5}"}
                  </div>
                  <h4>No routines yet</h4>
                  <p>Create a routine and reminder to support a consistent schedule.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Communication Prompts</p>
                  <h3>Conversation support</h3>
                </div>
                <Badge tone="warm">{communicationPrompts.length} prompts</Badge>
              </div>

              {communicationPrompts.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {communicationPrompts.map((prompt) => (
                    <div key={prompt.prompt_id} className="parent-dashboard__task-item">
                      <div className="parent-dashboard__task-item-top">
                        <div>
                          <h4>{prompt.title}</h4>
                          <p>{prompt.prompt_text}</p>
                        </div>
                        <Badge tone="sky">{prompt.category || "general"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F4AC}"}
                  </div>
                  <h4>No prompts yet</h4>
                  <p>Add prompts to help parents stay updated with the child's activities.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Resources & Expert Tips</p>
                  <h3>Support library</h3>
                </div>
                <Badge tone="mint">{supportResources.length} resources</Badge>
              </div>

              {supportResources.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {supportResources.map((resource) => (
                    <div key={resource.resource_id} className="parent-dashboard__task-item">
                      <div className="parent-dashboard__task-item-top">
                        <div>
                          <h4>{resource.title}</h4>
                          <p>{resource.description}</p>
                        </div>
                        <Badge tone="warm">{resource.category}</Badge>
                      </div>
                      {resource.url ? (
                        <div className="parent-dashboard__task-meta">
                          <a href={resource.url} target="_blank" rel="noreferrer">
                            Open resource
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    {"\u{1F4DA}"}
                  </div>
                  <h4>No resources yet</h4>
                  <p>Add support resources or expert tips for parents.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Reminder Notifications</p>
                  <h3>Enable browser reminders</h3>
                </div>
              </div>

              <p className="page-text">
                This prototype sends a browser notification when the page is open and the reminder time is reached.
              </p>

              {reminderNotificationMessage ? (
                <p className="parent-dashboard__message">{reminderNotificationMessage}</p>
              ) : null}

              <Button variant="secondary" onClick={handleEnableReminderNotifications}>
                Enable Reminder Notifications
              </Button>
            </Card>
            <Card
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Create Routine</p>
                  <h3>Plan a consistent schedule</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Routine title"
                  value={routineTitle}
                  onChange={(event) => setRoutineTitle(event.target.value)}
                />

                <textarea
                  placeholder="Routine description"
                  value={routineDescription}
                  onChange={(event) => setRoutineDescription(event.target.value)}
                  rows={3}
                />

                <input
                  type="text"
                  placeholder="First routine item"
                  value={routineItemTitle}
                  onChange={(event) => setRoutineItemTitle(event.target.value)}
                />

                <input
                  type="time"
                  value={routineItemReminder}
                  onChange={(event) => setRoutineItemReminder(event.target.value)}
                />

                {routineMessage ? (
                  <p className="parent-dashboard__message">{routineMessage}</p>
                ) : null}

                <Button onClick={handleCreateRoutine} disabled={!hasChildAccount}>
                  Create Routine
                </Button>
              </div>
            </Card>
            <Card className="parent-dashboard__form-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Routine Item</p>
                  <h3>Extend an existing routine</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <select
                  value={selectedRoutineId}
                  onChange={(event) => setSelectedRoutineId(event.target.value)}
                >
                  <option value="">Select routine</option>
                  {routineBlocks.map((routine) => (
                    <option key={routine.routine_id} value={routine.routine_id}>
                      {routine.title}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Routine item title"
                  value={existingRoutineItemTitle}
                  onChange={(event) => setExistingRoutineItemTitle(event.target.value)}
                />

                <textarea
                  placeholder="Item description"
                  value={existingRoutineItemDescription}
                  onChange={(event) => setExistingRoutineItemDescription(event.target.value)}
                  rows={3}
                />

                <input
                  type="time"
                  value={existingRoutineItemReminder}
                  onChange={(event) => setExistingRoutineItemReminder(event.target.value)}
                />

                {routineItemMessage ? (
                  <p className="parent-dashboard__message">{routineItemMessage}</p>
                ) : null}

                <Button onClick={handleCreateRoutineItemForExistingRoutine} disabled={!hasChildAccount}>
                  Add Routine Item
                </Button>
              </div>
            </Card>
            <Card className="parent-dashboard__form-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Prompt</p>
                  <h3>Support communication</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Prompt title"
                  value={promptTitle}
                  onChange={(event) => setPromptTitle(event.target.value)}
                />

                <textarea
                  placeholder="Prompt text"
                  value={promptText}
                  onChange={(event) => setPromptText(event.target.value)}
                  rows={3}
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={promptCategory}
                  onChange={(event) => setPromptCategory(event.target.value)}
                />

                {promptMessage ? (
                  <p className="parent-dashboard__message">{promptMessage}</p>
                ) : null}

                <Button onClick={handleCreatePrompt} disabled={!hasChildAccount}>
                  Create Prompt
                </Button>
              </div>
            </Card>

            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Resource</p>
                  <h3>Save expert tips</h3>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Resource title"
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={resourceCategory}
                  onChange={(event) => setResourceCategory(event.target.value)}
                />

                <textarea
                  placeholder="Description"
                  value={resourceDescription}
                  onChange={(event) => setResourceDescription(event.target.value)}
                  rows={3}
                />

                <input
                  type="text"
                  placeholder="Optional URL"
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                />

                {resourceMessage ? (
                  <p className="parent-dashboard__message">{resourceMessage}</p>
                ) : null}

                <Button onClick={handleCreateResource}>
                  Create Resource
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}

export default ParentDashboard;
