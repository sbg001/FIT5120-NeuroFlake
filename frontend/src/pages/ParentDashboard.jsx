import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import OpenMojiIcon from "../components/ui/OpenMojiIcon";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import EmotionInsights from "../components/ui/EmotionInsights";
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
  getSensoryRiskPrediction,
  getTasks,
  resetTaskStatus,
  updateTask,
  updateTaskStepCount,
  getParentDashboardCore,
  getParentDashboardSupport,
} from "../services";

function ParentDashboard() {
  const starterRewardOptions = [
    {
      id: "story-time",
      title: "Extra story time",
      cost: 20,
      icon: "books",
      note: "A quick, easy reward for steady effort.",
    },
    {
      id: "choose-snack",
      title: "Choose a special snack",
      cost: 35,
      icon: "gift",
      note: "Good for a mid-level milestone.",
    },
    {
      id: "park-visit",
      title: "Choose the next park visit",
      cost: 60,
      icon: "seedling",
      note: "Works well as a bigger weekly reward.",
    },
    {
      id: "movie-night",
      title: "Family movie night pick",
      cost: 80,
      icon: "star",
      note: "A meaningful reward for strong consistency.",
    },
  ];

  const location = useLocation();
  const [parentProfile, setParentProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [isLoadingCore, setIsLoadingCore] = useState(true);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [hasLoadedSupport, setHasLoadedSupport] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [editTaskId, setEditTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [deleteTaskMessage, setDeleteTaskMessage] = useState("");

  const [resetTaskMessage, setResetTaskMessage] = useState("");
  const [taskPage, setTaskPage] = useState(1);

  const [rewards, setRewards] = useState([]);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardCost, setRewardCost] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");
  const [rewardPage, setRewardPage] = useState(1);

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

  const [emotionLogs, setEmotionLogs] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [existingRoutineItemTitle, setExistingRoutineItemTitle] = useState("");
  const [existingRoutineItemDescription, setExistingRoutineItemDescription] = useState("");
  const [existingRoutineItemReminder, setExistingRoutineItemReminder] = useState("");
  const [routineItemMessage, setRoutineItemMessage] = useState("");
  const [reminderNotificationMessage, setReminderNotificationMessage] = useState("");

  const scrollToTriggerForm = () => {
    const triggerForm = document.getElementById("add-trigger-form");

    if (triggerForm) {
      triggerForm.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const scrollToRoutineForm = () => {
    const routineForm = document.getElementById("add-routine-form");

    if (routineForm) {
      routineForm.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const scrollToPromptForm = () => {
    const promptForm = document.getElementById("add-prompt-form");

    if (promptForm) {
      promptForm.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const scrollToResourceForm = () => {
    const resourceForm = document.getElementById("add-resource-form");

    if (resourceForm) {
      resourceForm.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const scrollToParentSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const activeSection = useMemo(() => {
    if (location.pathname === "/parent/rewards") return "rewards";
    if (location.pathname === "/parent/insights") return "insights";
    if (location.pathname === "/parent/support") return "support";
    return "tasks";
  }, [location.pathname]);

  useEffect(() => {
    const totalRewardPages = Math.max(1, Math.ceil(rewards.length / 5));
    setRewardPage((currentPage) => Math.min(currentPage, totalRewardPages));
  }, [rewards.length]);

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
      setDashboardError("");

      const parentId = localStorage.getItem("current_user_id");
      const activeChildId = localStorage.getItem("current_child_id") || "";

      const coreResult = await getParentDashboardCore(parentId, activeChildId);

      if (coreResult.error || !coreResult.data) {
        setDashboardError(coreResult.error || "Could not load dashboard.");
        setIsLoadingCore(false);
        return;
      }

      setParentProfile(coreResult.data.parent);
      setChildProfile(coreResult.data.child);
      setTasks(coreResult.data.tasks || []);
      setPointsData(coreResult.data.points || { points_balance: 0 });
      setRewards(coreResult.data.rewards || []);
      setDashboardError("");
      setIsLoadingCore(false);
    }

    loadCoreDashboardData();
  }, []);

  const loadSupportData = useCallback(async (childId) => {
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

    const supportResult = await getParentDashboardSupport(childId);
    const supportData = supportResult.data || {};

    setTriggers(supportData.triggers || []);
    setSuggestions(supportData.suggestions || []);
    setRoutineBlocks(supportData.routineBlocks || []);
    setCommunicationPrompts(supportData.communicationPrompts || []);
    setSupportResources(supportData.supportResources || []);
    setEmotionLogs(supportData.emotionLogs || []);
    setDashboardError(supportResult.error || "");
    setHasLoadedSupport(true);
    setIsLoadingSupport(false);
  }, []);

  const loadInsights = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isLoadingCore || !childProfile?.user_id) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (activeSection === "insights" && !riskForecast) {
        void loadInsights();
      }

      if (!hasLoadedSupport) {
        void loadSupportData(childProfile.user_id);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeSection,
    childProfile,
    hasLoadedSupport,
    isLoadingCore,
    loadInsights,
    loadSupportData,
    riskForecast,
  ]);

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

  const handleCreateTask = async () => {
    setCreateMessage("");

    if (!hasChildAccount) {
      setCreateMessage("Please create a child account before creating tasks.");
      return;
    }

    if (!title.trim()) {
      setCreateMessage("Please enter a task title.");
      return;
    }

    setIsCreatingTask(true);

    const result = await createTask({
      child_id: childProfile.user_id,
      created_by: parentProfile.user_id,
      title: title.trim(),
      description: description.trim() || title.trim(),
      status: "pending",
      total_steps: 0,
      completed_steps: 0,
      priority_type: null,
      priority_rank: null,
    });

    if (result.error) {
      setCreateMessage("Failed to create task.");
      setIsCreatingTask(false);
      return;
    }

    const createdTask = result.data;
    const generatedStepsResult = await generateTaskSteps(
      title.trim(),
      description.trim() || title.trim()
    );
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
    setEditMessage("");
  };

  const handleUpdateTask = async () => {
    setEditMessage("");

    if (!editTaskId || !editTitle.trim()) {
      setEditMessage("Please choose a task and update its title.");
      return;
    }

    const selectedTask = tasks.find((task) => String(task.task_id) === String(editTaskId));

    const result = await updateTask(editTaskId, {
      title: editTitle.trim(),
      description: editDescription.trim() || editTitle.trim(),
      priority_type: selectedTask?.priority_type || null,
      priority_rank: selectedTask?.priority_rank || null,
    });

    if (result.error) {
      setEditMessage("Failed to update task.");
      return;
    }

    await refreshTasks();
    setEditMessage("Task updated successfully.");
  };

  const handleCreateReward = async () => {
    setRewardMessage("");

    if (!rewardTitle || !rewardCost) {
      setRewardMessage("Please complete the required reward fields.");
      return;
    }

    const result = await createParentReward({
      title: rewardTitle,
      cost: Number(rewardCost),
    });

    if (result.error) {
      setRewardMessage("Failed to create reward.");
      return;
    }

    await refreshRewards();
    setRewardTitle("");
    setRewardCost("");
    setRewardMessage("Reward created successfully.");
  };

  const handleQuickCreateReward = async (rewardOption) => {
    setRewardMessage("");

    const result = await createParentReward({
      title: rewardOption.title,
      cost: rewardOption.cost,
    });

    if (result.error) {
      setRewardMessage("The suggested reward could not be added yet.");
      return;
    }

    await refreshRewards();
    setRewardTitle("");
    setRewardCost("");
    setRewardMessage(`${rewardOption.title} added to rewards.`);
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

  const handleDeleteReward = async (rewardId) => {
    setDeleteRewardMessage("");

    if (!rewardId) {
      setDeleteRewardMessage("Choose a reward to delete.");
      return;
    }

    const rewardToDelete = rewards.find((reward) => String(reward.id) === String(rewardId));
    const result = await deleteParentReward(rewardId);

    if (result.error) {
      setDeleteRewardMessage("Failed to delete reward.");
      return;
    }

    await refreshRewards();
    setDeleteRewardMessage(
      rewardToDelete?.title ? `${rewardToDelete.title} deleted.` : "Reward deleted."
    );
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
  const totalPoints = pointsData.points_balance ?? 0;
  const todayDateKey = new Date().toDateString();
  const isToday = (dateValue) => {
    if (!dateValue) return false;
    return new Date(dateValue).toDateString() === todayDateKey;
  };
  const completedTodayCount = completedTasks.filter((task) =>
    isToday(task.updated_at || task.created_at)
  ).length;
  const currentStreak = completedTodayCount > 0 ? 1 : 0;
  const routineTotals = routineBlocks.reduce(
    (totals, routine) => ({
      complete: totals.complete + Number(routine.completed_count || 0),
      total: totals.total + Number(routine.total_count || 0),
    }),
    { complete: 0, total: 0 }
  );
  const routineConsistency =
    routineTotals.total > 0
      ? Math.round((routineTotals.complete / routineTotals.total) * 100)
      : 0;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const featuredTask = activeTasks[0] || completedTasks[0] || null;
  const nextParentAction = !featuredTask
    ? {
        title: "Create the first task",
        text: "Start with one clear task. Steps will be created for you.",
        cta: "Add Task",
        target: "create-task-panel",
      }
    : activeTasks.length > 0
      ? {
          title: "Check the active list",
          text: `${activeTasks.length} task${activeTasks.length === 1 ? "" : "s"} still need attention.`,
          cta: "View Tasks",
          target: "task-board-panel",
        }
      : {
          title: "Plan the next task",
          text: "Everything is complete. Add one task when you are ready.",
          cta: "Add Task",
          target: "create-task-panel",
        };

  const getStatusConfig = (task) => {
    const completed = String(task.status) === "completed";
    const totalSteps = Math.max(Number(task.total_steps || 0), 1);
    const doneSteps = Number(task.completed_steps || 0);

    if (completed || doneSteps >= totalSteps) {
      return {
        label: "Completed",
        tone: "mint",
      };
    }

    if (doneSteps > 0) {
      return {
        label: "In progress",
        tone: "sky",
      };
    }

    return {
      label: "Ready",
      tone: "warm",
    };
  };

  const renderTaskOption = (task) =>
    `${task.title} (${getStatusConfig(task).label.toLowerCase()})`;

  const taskPageSize = 3;
  const totalTaskPages = Math.max(1, Math.ceil(childTasks.length / taskPageSize));
  const currentTaskPage = Math.min(taskPage, totalTaskPages);
  const visibleChildTasks = childTasks.slice(
    (currentTaskPage - 1) * taskPageSize,
    currentTaskPage * taskPageSize
  );

  const rewardPageSize = 3;
  const totalRewardPages = Math.max(1, Math.ceil(rewards.length / rewardPageSize));
  const currentRewardPage = Math.min(rewardPage, totalRewardPages);
  const visibleRewards = rewards.slice(
    (currentRewardPage - 1) * rewardPageSize,
    currentRewardPage * rewardPageSize
  );

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
  const recentActivity = [...childTasks]
    .sort((first, second) => {
      const firstDate = new Date(first.updated_at || first.created_at || 0).getTime();
      const secondDate = new Date(second.updated_at || second.created_at || 0).getTime();
      return secondDate - firstDate;
    })
    .slice(0, 4);
  const parentInsightCards = [
    {
      icon: "herb",
      title: "Keep today simple",
      text:
        activeTasks.length > 0
          ? `${activeTasks.length} task${activeTasks.length === 1 ? "" : "s"} still active. Choose one to focus on first.`
          : "All tasks are complete. A calm finish matters too.",
    },
    {
      icon: "compass",
      title: "Routine rhythm",
      text:
        routineBlocks.length > 0
          ? `${routineConsistency}% routine consistency across saved routines.`
          : "Add a routine when you want mornings or evenings to feel more predictable.",
    },
    {
      icon: "sparkles",
      title: "Support signal",
      text:
        suggestions[0]?.text ||
        (repeatedTriggerEntry
          ? `Watch for ${repeatedTriggerEntry[0]} this week.`
          : "No repeated trigger pattern yet."),
    },
  ];
  const shouldShowChildSetup = !isLoadingCore && Boolean(parentProfile) && !hasChildAccount;
  const isTasksPage = activeSection === "tasks";

  const sectionHeader = {
    tasks: {
      eyebrow: "Parent",
      title: `${parentProfile.name}'s dashboard`,
      description: hasChildAccount
        ? `Manage ${childProfile.name}'s tasks, points, and login.`
        : "Create a child account to begin.",
    },
    rewards: {
      eyebrow: "Rewards",
      title: "Rewards",
      description: hasChildAccount
        ? `Set rewards for ${childProfile.name}.`
        : "Create a child account to add rewards.",
    },
    insights: {
      eyebrow: "Insights",
      title: "Insights",
      description: hasChildAccount
        ? `Review patterns for ${childProfile.name}.`
        : "Create a child account to view insights.",
    },
    support: {
      eyebrow: "Support",
      title: "Support tools",
      description: hasChildAccount
        ? `Keep routines, prompts, and resources in one place.`
        : "Create a child account to use support tools.",
    },
  }[activeSection];

  return (
    <section className="page-section parent-dashboard">
      {shouldShowChildSetup ? (
        <div className="parent-setup-modal" role="dialog" aria-modal="true" aria-labelledby="child-setup-title">
          <div className="parent-setup-modal__backdrop" />
          <Card className="parent-setup-modal__panel" variant="glow">
            <div className="parent-setup-modal__content">
              <div className="parent-setup-modal__hero" aria-hidden="true">
                <OpenMojiIcon name="baby" />
              </div>
              <div className="parent-setup-modal__copy">
                <p className="eyebrow">First step</p>
                <h3 id="child-setup-title">Create a child profile</h3>
                <p className="page-text">
                  Add one child account for tasks, rewards, and support tools.
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
                  Save Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <PageHeader
        eyebrow={sectionHeader.eyebrow}
        title={sectionHeader.title}
        description={sectionHeader.description}
      />

      {dashboardError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{dashboardError}</p>
        </Card>
      ) : null}

      {isTasksPage ? (
        <>
      <Card className="parent-dashboard__family-hero" variant="glow">
        <div className="parent-dashboard__orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h3>{childProfile?.name || "Your child"} is {completionPercent}% through their tasks.</h3>
          <p className="page-text">
            {featuredTask
              ? `Current focus: ${featuredTask.title}.`
              : "No current focus yet. Add a small task when ready."}
          </p>
        </div>
        <div className="parent-dashboard__hero-action">
          <Button
            type="button"
            onClick={() => scrollToParentSection(nextParentAction.target)}
          >
            {nextParentAction.cta}
          </Button>
          <span>{nextParentAction.title}</span>
        </div>
      </Card>

      <div className="parent-dashboard__overview-cards" aria-label="Parent overview">
        <Card className="parent-dashboard__overview-card" variant="soft">
          <span aria-hidden="true"><OpenMojiIcon name="check" /></span>
          <p>Tasks completed today</p>
          <strong>{completedTodayCount}</strong>
        </Card>
        <Card className="parent-dashboard__overview-card" variant="soft">
          <span aria-hidden="true"><OpenMojiIcon name="fire" /></span>
          <p>Current streak</p>
          <strong>{currentStreak} day</strong>
        </Card>
        <Card className="parent-dashboard__overview-card" variant="soft">
          <span aria-hidden="true"><OpenMojiIcon name="star" /></span>
          <p>Rewards earned</p>
          <strong>{totalPoints}</strong>
        </Card>
        <Card className="parent-dashboard__overview-card" variant="soft">
          <span aria-hidden="true"><OpenMojiIcon name="herb" /></span>
          <p>Routine consistency</p>
          <strong>{routineConsistency}%</strong>
        </Card>
      </div>
        </>
      ) : null}

      {activeSection === "tasks" ? (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            <Card className="parent-dashboard__progress-section" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Child progress</p>
                  <h3>Progress without pressure</h3>
                  <p className="page-text">
                    A simple view of tasks finished, active, and waiting.
                  </p>
                </div>
                <Badge tone="mint">{completionPercent}% complete</Badge>
              </div>
              <div className="parent-dashboard__progress-panel">
                <div className="parent-dashboard__focus-score" aria-label={`${completionPercent}% complete`}>
                  <strong>{completionPercent}%</strong>
                  <span>done</span>
                </div>
                <div className="parent-dashboard__progress-copy">
                  <div className="parent-dashboard__snapshot-row">
                    <h4>{featuredTask ? featuredTask.title : "No task selected"}</h4>
                    {featuredTask ? (
                      <Badge tone={getStatusConfig(featuredTask).tone}>
                        {getStatusConfig(featuredTask).label}
                      </Badge>
                    ) : null}
                  </div>
                  {featuredTask?.description ? <p>{featuredTask.description}</p> : null}
                  <ProgressBar value={completionPercent} max={100} label="Child task completion progress" />
                </div>
              </div>
            </Card>

            <Card id="task-board-panel" className="parent-dashboard__collection-card parent-dashboard__task-board" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Task board</p>
                  <h3>What needs attention</h3>
                </div>
                <Badge tone="sky">{totalTasks} tasks</Badge>
              </div>

              {childTasks.length > 0 ? (
                <div className="parent-dashboard__task-list">
                  {visibleChildTasks.map((task) => {
                    const totalSteps = Math.max(Number(task.total_steps || 0), 1);
                    const doneSteps = Math.min(Number(task.completed_steps || 0), totalSteps);
                    const status = getStatusConfig(task);

                    return (
                      <div key={task.task_id} className="parent-dashboard__task-item">
                        <div className="parent-dashboard__task-item-top">
                          <div>
                            <h4>{task.title}</h4>
                            <p>{task.description || "No note."}</p>
                          </div>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>

                        <ProgressBar
                          value={doneSteps}
                          max={totalSteps}
                          label={`${task.title} progress`}
                        />

                        <div className="parent-dashboard__task-actions">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              setResetTaskMessage("");
                              const result = await resetTaskStatus(task.task_id);

                              if (result.error) {
                                setResetTaskMessage(result.error);
                                return;
                              }

                              setResetTaskMessage(`${task.title} was reset.`);
                              await refreshTasks();
                            }}
                          >
                            <OpenMojiIcon name="hourglass" className="parent-dashboard__button-icon" />
                            Reset
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              setDeleteTaskMessage("");
                              const result = await deleteTask(task.task_id);

                              if (result.error) {
                                setDeleteTaskMessage(result.error);
                                return;
                              }

                              setDeleteTaskMessage(`${task.title} was deleted.`);
                              await refreshTasks();
                            }}
                          >
                            <OpenMojiIcon name="trash" className="parent-dashboard__button-icon" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {resetTaskMessage || deleteTaskMessage ? (
                    <p className="parent-dashboard__message">
                      {resetTaskMessage || deleteTaskMessage}
                    </p>
                  ) : null}

                  {childTasks.length > taskPageSize ? (
                    <div className="parent-dashboard__pagination" aria-label="Task pages">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentTaskPage === 1}
                        onClick={() => setTaskPage((page) => Math.max(1, page - 1))}
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentTaskPage} of {totalTaskPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentTaskPage === totalTaskPages}
                        onClick={() =>
                          setTaskPage((page) => Math.min(totalTaskPages, page + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="memo" />
                  </div>
                  <h4>No tasks yet</h4>
                  <p>Create the first task.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__routine-section" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Routine management</p>
                  <h3>Predictable routines</h3>
                  <p className="page-text">
                    Keep daily routines visible without adding clutter.
                  </p>
                </div>
                <Badge tone="sky">{routineBlocks.length} routines</Badge>
              </div>

              {routineBlocks.length > 0 ? (
                <div className="parent-dashboard__routine-grid">
                  {routineBlocks.slice(0, 3).map((routine) => (
                    <div key={routine.routine_id} className="parent-dashboard__routine-card">
                      <div>
                        <strong>{routine.title}</strong>
                        <p>{routine.description || "Routine ready."}</p>
                      </div>
                      <Badge tone="mint">
                        {routine.completed_count || 0}/{routine.total_count || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state parent-dashboard__empty-state--compact">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="herb" />
                  </div>
                  <p>No routines yet. Add one from Support when you are ready.</p>
                </div>
              )}
            </Card>

          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__insight-panel" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Helpful insights</p>
                  <h3>Small signals</h3>
                </div>
              </div>
              <div className="parent-dashboard__insight-card-list">
                {parentInsightCards.map((insight) => (
                  <div key={insight.title} className="parent-dashboard__insight-mini-card">
                    <span aria-hidden="true"><OpenMojiIcon name={insight.icon} /></span>
                    <div>
                      <strong>{insight.title}</strong>
                      <p>{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="parent-dashboard__activity-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h3>Latest updates</h3>
                </div>
              </div>
              {recentActivity.length > 0 ? (
                <div className="parent-dashboard__activity-list">
                  {recentActivity.map((task) => (
                    <div key={task.task_id} className="parent-dashboard__activity-item">
                      <span aria-hidden="true">
                        <OpenMojiIcon
                          name={getStatusConfig(task).label === "Completed" ? "check" : "hourglass"}
                        />
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <p>{getStatusConfig(task).label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="page-text">No activity yet.</p>
              )}
            </Card>

            <Card
              id="create-task-panel"
              className="parent-dashboard__form-card parent-dashboard__form-card--feature parent-dashboard__quick-create"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add task</p>
                  <h3>Create task</h3>
                  <p className="page-text">
                    Write it once. NeuroFlake builds the steps.
                  </p>
                </div>
              </div>

              <div className="parent-dashboard__quick-create-grid">
                <input
                  type="text"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Helpful note for your child (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                {createMessage ? (
                  <p className="parent-dashboard__message">{createMessage}</p>
                ) : (
                  <p className="parent-dashboard__helper-text">
                    Try: Pack school bag, brush teeth, put toys away.
                  </p>
                )}
                <Button onClick={handleCreateTask} disabled={isCreatingTask || !hasChildAccount}>
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </Card>

            <Card className="parent-dashboard__form-card parent-dashboard__edit-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Edit task</p>
                  <h3>Update details</h3>
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
                  placeholder="Helpful note (optional)"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
                {editMessage ? (
                  <p className="parent-dashboard__message">{editMessage}</p>
                ) : null}
                <Button onClick={handleUpdateTask}>Update Task</Button>
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === "rewards" ? (
        <div className="parent-dashboard__workspace-grid parent-dashboard__rewards-workspace">
          <div className="parent-dashboard__main-column">
            <Card
              className="parent-dashboard__form-card parent-dashboard__form-card--feature parent-dashboard__reward-create-card"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add reward</p>
                  <h3>Make a reward</h3>
                </div>
                <div className="parent-dashboard__reward-icon" aria-hidden="true">
                  <OpenMojiIcon name="gift" />
                </div>
              </div>

              <div className="parent-dashboard__form-grid parent-dashboard__reward-form-grid">
                <input
                  type="text"
                  placeholder="Reward name"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Points cost"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(e.target.value)}
                />
                {rewardMessage ? (
                  <p className="parent-dashboard__message">{rewardMessage}</p>
                ) : (
                  <p className="parent-dashboard__helper-text">
                    Small rewards: 20-40 points. Bigger rewards: 60+.
                  </p>
                )}
                <Button onClick={handleCreateReward}>
                  <OpenMojiIcon name="star" className="parent-dashboard__button-icon" />
                  Add Reward
                </Button>
              </div>

              <div className="parent-dashboard__reward-suggestions">
                <div className="parent-dashboard__reward-suggestions-copy">
                  <h4>Quick adds</h4>
                  <p className="page-text">Tap one to add it now.</p>
                </div>

                <div className="parent-dashboard__reward-suggestion-grid">
                  {starterRewardOptions.map((rewardOption) => (
                    <div
                      key={rewardOption.id}
                      className="parent-dashboard__reward-suggestion"
                    >
                      <div className="parent-dashboard__reward-suggestion-copy">
                        <span className="parent-dashboard__reward-suggestion-icon" aria-hidden="true">
                          <OpenMojiIcon name={rewardOption.icon} />
                        </span>
                        <div>
                          <strong>{rewardOption.title}</strong>
                          <p>{rewardOption.note}</p>
                        </div>
                      </div>
                      <div className="parent-dashboard__reward-suggestion-meta">
                        <Badge tone="warm">{rewardOption.cost} points</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleQuickCreateReward(rewardOption)}
                        >
                          Quick Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__collection-card parent-dashboard__reward-board" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Rewards</p>
                  <h3>Available rewards</h3>
                </div>
                <Badge tone="warm">
                  {rewards.filter((reward) => reward.approved).length} active
                </Badge>
              </div>

              {deleteRewardMessage ? (
                <p className="parent-dashboard__message">{deleteRewardMessage}</p>
              ) : null}

              {rewards.length > 0 ? (
                <div className="parent-dashboard__reward-grid">
                  {visibleRewards.map((reward) => (
                    <div key={reward.id} className="parent-dashboard__reward-item">
                      <div className="parent-dashboard__reward-top">
                        <div className="parent-dashboard__reward-title-row">
                          <span className="parent-dashboard__reward-icon" aria-hidden="true">
                            <OpenMojiIcon name="gift" />
                          </span>
                          <div>
                            <h4>{reward.title}</h4>
                            <p>{reward.cost} points</p>
                          </div>
                        </div>
                        <Badge tone={reward.approved ? "mint" : "default"}>
                          {reward.approved ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                      <div className="parent-dashboard__reward-meta">
                        <span>{reward.theme || "Custom reward"}</span>
                      </div>
                      <div className="parent-dashboard__task-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteReward(reward.id)}
                        >
                          <OpenMojiIcon name="trash" className="parent-dashboard__button-icon" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parent-dashboard__empty-state">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="gift" />
                  </div>
                  <h4>No rewards yet</h4>
                  <p>Add the first reward.</p>
                </div>
              )}

              {rewards.length > rewardPageSize ? (
                <div className="parent-dashboard__pagination" aria-label="Reward pages">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentRewardPage === 1}
                    onClick={() => setRewardPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentRewardPage} of {totalRewardPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentRewardPage === totalRewardPages}
                    onClick={() =>
                      setRewardPage((page) => Math.min(totalRewardPages, page + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      ) : activeSection === "insights" ? (
        <>
            <EmotionInsights />
            <div className="parent-dashboard__workspace-grid">
              <div className="parent-dashboard__main-column">
                <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Forecast</p>
                  <h3>Sensory risk</h3>
                </div>
                {isLoadingInsights ? (
                  <Badge tone="default">Analyzing</Badge>
                ) : riskForecast ? (
                  <Badge tone={riskTone}>{riskForecast.risk_level} risk</Badge>
                ) : (
                  <Badge tone="default">Engine offline</Badge>
                )}
              </div>

              <div className="parent-dashboard__insight-metrics">
                <div>
                  <strong>{riskForecast?.risk_level || "No data"}</strong>
                  <span>Risk level</span>
                </div>
                <div>
                  <strong>{completedTasks.length}</strong>
                  <span>Completed tasks</span>
                </div>
                <div>
                  <strong>{emotionLogs.length}</strong>
                  <span>Emotion logs</span>
                </div>
              </div>

              {isLoadingSupport ? (
                <p className="page-text">Loading insights...</p>
              ) : null}

              {riskForecast ? (
                <div className="parent-dashboard__insight-callout">
                  <strong>Suggestion</strong>
                  <p>{riskForecast.advisory_text}</p>
                </div>
              ) : (
                <div className="parent-dashboard__empty-state parent-dashboard__empty-state--compact">
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="brain" />
                  </div>
                  <p>
                    {isLoadingInsights
                      ? "Loading forecast."
                      : "No forecast yet."}
                  </p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Emotions</p>
                  <h3>Weekly pattern</h3>
                </div>
              </div>

              {isLoadingSupport ? (
                <p className="page-text">Loading emotions...</p>
              ) : null}

              <p className="page-text">
                Saved emotion check-ins for this week.
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
                Based on saved check-ins.
              </p>
            </Card>

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Triggers</p>
                  <h3>Logged triggers</h3>
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
                <div
                  className="parent-dashboard__empty-state"
                  role="button"
                  tabIndex={0}
                  onClick={scrollToTriggerForm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      scrollToTriggerForm();
                    }
                  }}
                >
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="magnifier" />
                  </div>
                  <h4>No triggers yet</h4>
                  <p>Add the first trigger.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Suggestions</p>
                  <h3>Next steps</h3>
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
                    <OpenMojiIcon name="lightbulb" />
                  </div>
                  <h4>No suggestions yet</h4>
                  <p>Add triggers or emotion logs first.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Use this</p>
                  <h3>Simple check</h3>
                </div>
              </div>
            <div className="parent-dashboard__insight-notes">
              <p>1. Check repeated triggers.</p>
              <p>2. Simplify the next task.</p>
              <p>3. Adjust routines.</p>
            </div>
              <Button variant="secondary" onClick={loadInsights} disabled={isLoadingInsights}>
                {isLoadingInsights ? "Refreshing..." : "Refresh Insights"}
              </Button>
            </Card>

            <Card
              id="add-trigger-form"
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add trigger</p>
                  <h3>Log trigger</h3>
                  <p className="page-text">
                    Note what made the moment harder.
                  </p>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Trigger name, e.g. Loud noise or sudden change"
                  value={triggerTitle}
                  onChange={(event) => setTriggerTitle(event.target.value)}
                />

                <select
                  value={triggerType}
                  onChange={(event) => setTriggerType(event.target.value)}
                >
                  <option value="">What type of trigger is this?</option>
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
      </>
      ) : (
        <div className="parent-dashboard__workspace-grid">
          <div className="parent-dashboard__main-column">
            {isLoadingSupport ? (
              <Card className="parent-dashboard__collection-card" variant="soft">
                <div className="parent-dashboard__section-header">
                  <div>
                    <p className="eyebrow">Support</p>
                    <h3>Loading tools</h3>
                  </div>
                </div>
                <p className="page-text">
                  Loading routines, prompts, and resources.
                </p>
              </Card>
            ) : null}

            <Card className="parent-dashboard__collection-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Routines</p>
                  <h3>Saved routines</h3>
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
                <div
                  className="parent-dashboard__empty-state"
                  role="button"
                  tabIndex={0}
                  onClick={scrollToRoutineForm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      scrollToRoutineForm();
                    }
                  }}
                >
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="calendar" />
                  </div>
                  <h4>No routines yet</h4>
                  <p>Create the first routine.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Prompts</p>
                  <h3>Conversation prompts</h3>
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
                <div
                  className="parent-dashboard__empty-state"
                  role="button"
                  tabIndex={0}
                  onClick={scrollToPromptForm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      scrollToPromptForm();
                    }
                  }}
                >
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="speech" />
                  </div>
                  <h4>No prompts yet</h4>
                  <p>Add the first prompt.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Resources</p>
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
                <div
                  className="parent-dashboard__empty-state"
                  role="button"
                  tabIndex={0}
                  onClick={scrollToResourceForm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      scrollToResourceForm();
                    }
                  }}
                >
                  <div className="parent-dashboard__empty-icon" aria-hidden="true">
                    <OpenMojiIcon name="books" />
                  </div>
                  <h4>No resources yet</h4>
                  <p>Add the first resource.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Reminders</p>
                  <h3>Browser reminders</h3>
                </div>
              </div>

              <p className="page-text">
                Sends a browser notification when this page is open.
              </p>

              {reminderNotificationMessage ? (
                <p className="parent-dashboard__message">{reminderNotificationMessage}</p>
              ) : null}

              <Button variant="secondary" onClick={handleEnableReminderNotifications}>
                Enable Reminders
              </Button>
            </Card>
            <Card
              id="add-routine-form"
              className="parent-dashboard__form-card parent-dashboard__form-card--feature"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add routine</p>
                  <h3>Create routine</h3>
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
                  <p className="eyebrow">Add item</p>
                  <h3>Routine item</h3>
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
            <Card id="add-prompt-form" className="parent-dashboard__form-card" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add prompt</p>
                  <h3>Create prompt</h3>
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
            
            <Card id="add-resource-form" className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add resource</p>
                  <h3>Create resource</h3>
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
