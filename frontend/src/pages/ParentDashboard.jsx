import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  deleteParentReward,
  deleteRoutine,
  deleteRoutineItem,
  deleteTask,
  generateTaskSteps,
  getAllRewardsForParent,
  getSensoryRiskPrediction,
  getTasks,
  resetTaskStatus,
  updateRoutineItem,
  updateTaskStepCount,
  getParentDashboardCore,
  getParentDashboardSupport,
  MAX_REWARD_COST,
  MIN_REWARD_COST,
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
  const [communicationPrompts, setCommunicationPrompts] = useState([]);
  const [supportResources, setSupportResources] = useState([]);
  const [routineBlocks, setRoutineBlocks] = useState([]);

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
  const [childAccountGender, setChildAccountGender] = useState("");
  const [childAccountUsername, setChildAccountUsername] = useState("");
  const [childAccountPassword, setChildAccountPassword] = useState("");
  const [childAccountMessage, setChildAccountMessage] = useState("");

  const [emotionLogs, setEmotionLogs] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [existingRoutineItemTitle, setExistingRoutineItemTitle] = useState("");
  const [existingRoutineItemDescription, setExistingRoutineItemDescription] = useState("");
  const [existingRoutineItemReminder, setExistingRoutineItemReminder] = useState("");
  const [routineItemMessage, setRoutineItemMessage] = useState("");
  const [routineActionMessage, setRoutineActionMessage] = useState("");
  const [updatingRoutineItemId, setUpdatingRoutineItemId] = useState("");
  const [deletingRoutineId, setDeletingRoutineId] = useState("");
  const [deletingRoutineItemId, setDeletingRoutineItemId] = useState("");

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
      const sectionTop = section.getBoundingClientRect().top;
      const stickyHeaderOffset = 140;

      window.scrollTo({
        behavior: "smooth",
        top: window.scrollY + sectionTop - stickyHeaderOffset,
      });
    }
  };

  const scrollToRoutineItemForm = () => {
    const routineItemForm = document.getElementById("add-routine-item-form");

    if (routineItemForm) {
      routineItemForm.scrollIntoView({
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

  const handleCreateReward = async () => {
    setRewardMessage("");

    if (!rewardTitle || !rewardCost) {
      setRewardMessage("Please complete the required reward fields.");
      return;
    }

    const normalizedRewardCost = Number(rewardCost);

    if (
      !Number.isInteger(normalizedRewardCost) ||
      normalizedRewardCost < MIN_REWARD_COST ||
      normalizedRewardCost > MAX_REWARD_COST
    ) {
      setRewardMessage(`Reward cost must be between ${MIN_REWARD_COST} and ${MAX_REWARD_COST} points.`);
      return;
    }

    const result = await createParentReward({
      title: rewardTitle,
      cost: normalizedRewardCost,
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
      !childAccountGender ||
      !childAccountUsername ||
      !childAccountPassword
    ) {
      setChildAccountMessage("Please complete all child account fields.");
      return;
    }

    const normalizedAge = Number(childAccountAge);

    if (!Number.isInteger(normalizedAge) || normalizedAge < 1 || normalizedAge > 17) {
      setChildAccountMessage("Child age must be between 1 and 17.");
      return;
    }

    const result = await createChildAccount({
      parentId: parentProfile.user_id,
      name: childAccountName,
      age: normalizedAge,
      gender: childAccountGender,
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
    setRoutineBlocks([]);
    setCommunicationPrompts([]);
    setSupportResources([]);
    setEmotionLogs([]);
    setChildAccountName("");
    setChildAccountAge("");
    setChildAccountGender("");
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
    setSelectedRoutineId(String(routineResult.data.routine_id));
    setRoutineMessage("Routine created. You can add more steps below.");
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
    setRoutineItemMessage("Step added to the routine.");
    await refreshEpic6Data();
  };

  const handleToggleRoutineItem = async (routineId, item) => {
    if (!item?.item_id) return;

    const nextCompleted = !item.is_completed;
    setRoutineActionMessage("");
    setUpdatingRoutineItemId(item.item_id);

    const result = await updateRoutineItem(item.item_id, nextCompleted);

    if (result.error) {
      setRoutineActionMessage("Could not update that routine item.");
      setUpdatingRoutineItemId("");
      return;
    }

    const updatedItem = result.data || {
      ...item,
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    };

    setRoutineBlocks((currentBlocks) =>
      currentBlocks.map((routine) => {
        if (String(routine.routine_id) !== String(routineId)) {
          return routine;
        }

        const updatedItems = (routine.items || []).map((routineItem) =>
          String(routineItem.item_id) === String(item.item_id)
            ? { ...routineItem, ...updatedItem }
            : routineItem
        );

        return {
          ...routine,
          items: updatedItems,
          completed_count: updatedItems.filter((routineItem) => routineItem.is_completed).length,
          total_count: updatedItems.length,
        };
      })
    );

    setRoutineActionMessage(
      nextCompleted ? `${item.title} marked done.` : `${item.title} moved back to active.`
    );
    setUpdatingRoutineItemId("");
  };

  const handleDeleteRoutine = async (routine) => {
    if (!routine?.routine_id) return;

    const shouldDelete = window.confirm(
      `Delete "${routine.title}" and all of its steps?`
    );

    if (!shouldDelete) {
      return;
    }

    setRoutineActionMessage("");
    setDeletingRoutineId(routine.routine_id);

    const result = await deleteRoutine(routine.routine_id);

    if (result.error) {
      setRoutineActionMessage(result.error);
      setDeletingRoutineId("");
      return;
    }

    setRoutineBlocks((currentBlocks) =>
      currentBlocks.filter(
        (currentRoutine) => String(currentRoutine.routine_id) !== String(routine.routine_id)
      )
    );

    if (String(selectedRoutineId) === String(routine.routine_id)) {
      setSelectedRoutineId("");
    }

    setRoutineActionMessage(`${routine.title} deleted.`);
    setDeletingRoutineId("");
  };

  const handleDeleteRoutineItem = async (routineId, item) => {
    if (!item?.item_id) return;

    const shouldDelete = window.confirm(`Delete "${item.title}" from this routine?`);

    if (!shouldDelete) {
      return;
    }

    setRoutineActionMessage("");
    setDeletingRoutineItemId(item.item_id);

    const result = await deleteRoutineItem(item.item_id);

    if (result.error) {
      setRoutineActionMessage(result.error);
      setDeletingRoutineItemId("");
      return;
    }

    setRoutineBlocks((currentBlocks) =>
      currentBlocks.map((routine) => {
        if (String(routine.routine_id) !== String(routineId)) {
          return routine;
        }

        const updatedItems = (routine.items || []).filter(
          (routineItem) => String(routineItem.item_id) !== String(item.item_id)
        );

        return {
          ...routine,
          items: updatedItems,
          completed_count: updatedItems.filter((routineItem) => routineItem.is_completed).length,
          total_count: updatedItems.length,
        };
      })
    );

    setRoutineActionMessage(`${item.title} deleted.`);
    setDeletingRoutineItemId("");
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
    setResourceMessage("Resource saved successfully.");
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
  const totalRoutineItems = routineBlocks.reduce(
    (count, routine) => count + Number(routine.total_count || routine.items?.length || 0),
    0
  );
  const nextRoutineItem = routineBlocks
    .flatMap((routine) =>
      (routine.items || []).map((item) => ({
        ...item,
        routineTitle: routine.title,
      }))
    )
    .filter((item) => !item.is_completed)
    .sort((first, second) =>
      String(first.reminder_time || "99:99").localeCompare(String(second.reminder_time || "99:99"))
    )[0];
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const normalizedChildGender = String(childProfile?.gender || "").toLowerCase();
  const childTaskPronoun =
    normalizedChildGender === "male"
      ? "his"
      : normalizedChildGender === "female"
        ? "her"
        : "their";
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
        label: "In Progress",
        tone: "sky",
      };
    }

    return {
      label: "Ready",
      tone: "warm",
    };
  };

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

  const recentActivity = [...childTasks]
    .sort((first, second) => {
      const firstDate = new Date(first.updated_at || first.created_at || 0).getTime();
      const secondDate = new Date(second.updated_at || second.created_at || 0).getTime();
      return secondDate - firstDate;
    })
    .slice(0, 4);
  const shouldShowChildSetup = !isLoadingCore && Boolean(parentProfile) && !hasChildAccount;
  const isTasksPage = activeSection === "tasks";

  const sectionHeader = {
    tasks: {
      eyebrow: "Parent",
      title: `${parentProfile.name}'s Dashboard`,
      description: hasChildAccount
        ? `Create tasks, check progress, and manage ${childProfile.name}'s account.`
        : "Create a child account to begin.",
    },
    rewards: {
      eyebrow: "Rewards",
      title: "Rewards",
      description: hasChildAccount
        ? `Add rewards ${childProfile.name} can earn with points.`
        : "Create a child account to add rewards.",
    },
    insights: {
      eyebrow: "Insights",
      title: "Insights",
      description: hasChildAccount
        ? `Check mood patterns and today's support needs for ${childProfile.name}.`
        : "Create a child account to view insights.",
    },
    support: {
      eyebrow: "Routine",
      title: "Routine Tools",
      description: hasChildAccount
        ? `Set up daily routine steps for ${childProfile.name}.`
        : "Create a child account to use routine tools.",
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
                <p className="eyebrow">First Step</p>
                <h3 id="child-setup-title">Create A Child Profile</h3>
                <p className="page-text">
                  Add your child so you can create tasks, rewards, and routines for them.
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
                  min="1"
                  max="17"
                  step="1"
                />
                <select
                  value={childAccountGender}
                  onChange={(event) => setChildAccountGender(event.target.value)}
                  aria-label="Child gender"
                >
                  <option value="">Child gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
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
          <p className="eyebrow">Today At A Glance</p>
          <h3>{childProfile?.name || "Your child"} is {completionPercent}% through {childTaskPronoun} tasks.</h3>
          <p className="page-text">
            {featuredTask
              ? `Current focus: ${featuredTask.title}.`
              : "No task is active yet. Add one when you are ready."}
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
            <Card id="task-board-panel" className="parent-dashboard__collection-card parent-dashboard__task-board" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Task Board</p>
                  <h3>Task Progress</h3>
                </div>
                <Badge tone="sky">{totalTasks} Tasks</Badge>
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
                            <p>{task.description || "No extra note added."}</p>
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
                  <h4>No Tasks Yet</h4>
                  <p>Create the first task.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__routine-section" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Routine Management</p>
                  <h3>Predictable Routines</h3>
                  <p className="page-text">
                    See today's routine steps and what has already been done.
                  </p>
                </div>
                <div className="parent-dashboard__section-actions">
                  <Badge tone="sky">{routineBlocks.length} Routines</Badge>
                  <Button as={Link} to="/parent/support" variant="secondary" size="sm">
                    <OpenMojiIcon name="calendar" className="parent-dashboard__button-icon" />
                    Open Routine
                  </Button>
                </div>
              </div>

              {routineBlocks.length > 0 ? (
                <div className="parent-dashboard__routine-grid">
                  {routineBlocks.slice(0, 3).map((routine) => (
                    <div key={routine.routine_id} className="parent-dashboard__routine-card">
                      <div>
                        <strong>{routine.title}</strong>
                        <p>{routine.description || "No extra note added."}</p>
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
                  <p>No routines yet. Open Routine to add the first one.</p>
                </div>
              )}
            </Card>

          </div>

          <div className="parent-dashboard__side-column">
            <Card
              id="create-task-panel"
              className="parent-dashboard__form-card parent-dashboard__form-card--feature parent-dashboard__quick-create"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Task</p>
                  <h3>Create Task</h3>
                  <p className="page-text">
                    Add one task and NeuroFlake will break it into smaller steps.
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

            <Card className="parent-dashboard__activity-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Recent Activity</p>
                  <h3>Latest Updates</h3>
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
                  <p className="eyebrow">Add Reward</p>
                  <h3>Create Reward</h3>
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
                  min={MIN_REWARD_COST}
                  max={MAX_REWARD_COST}
                  step="1"
                />
                {rewardMessage ? (
                  <p className="parent-dashboard__message">{rewardMessage}</p>
                ) : (
                  <p className="parent-dashboard__helper-text">
                    Use {MIN_REWARD_COST}-{MAX_REWARD_COST} points.
                  </p>
                )}
                <Button onClick={handleCreateReward}>
                  <OpenMojiIcon name="star" className="parent-dashboard__button-icon" />
                  Add Reward
                </Button>
              </div>

              <div className="parent-dashboard__reward-suggestions">
                <div className="parent-dashboard__reward-suggestions-copy">
                  <h4>Quick Adds</h4>
                  <p className="page-text">Choose a ready-made reward and add it instantly.</p>
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
                        <Badge tone="warm">{rewardOption.cost} Points</Badge>
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
                  <h3>Available Rewards</h3>
                </div>
                <Badge tone="warm">
                  {rewards.filter((reward) => reward.approved).length} Active
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
                        <span>{reward.theme || "Parent-created reward"}</span>
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
                  <h4>No Rewards Yet</h4>
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
                  <h3>Sensory Risk</h3>
                </div>
                {isLoadingInsights ? (
                  <Badge tone="default">Analyzing</Badge>
                ) : riskForecast ? (
                  <Badge tone={riskTone}>{riskForecast.risk_level} Risk</Badge>
                ) : (
                  <Badge tone="default">Engine Offline</Badge>
                )}
              </div>

              <div className="parent-dashboard__insight-metrics">
                <div>
                  <strong>{riskForecast?.risk_level || "Not ready"}</strong>
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
                  <strong>What To Try</strong>
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
                  <h3>Weekly Pattern</h3>
                </div>
              </div>

              {isLoadingSupport ? (
                <p className="page-text">Loading emotions...</p>
              ) : null}

              <p className="page-text">
                See how your child has been feeling across the week.
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
                This chart uses the emotion check-ins saved by your child.
              </p>
            </Card>

          </div>

          <div className="parent-dashboard__side-column">
            <Card className="parent-dashboard__form-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Use This</p>
                  <h3>Simple Check</h3>
                </div>
              </div>
            <div className="parent-dashboard__insight-notes">
              <p>1. Review the current risk level.</p>
              <p>2. Check the weekly emotion pattern.</p>
              <p>3. Simplify the next task if needed.</p>
            </div>
              <Button variant="secondary" onClick={loadInsights} disabled={isLoadingInsights}>
                {isLoadingInsights ? "Refreshing..." : "Refresh Insights"}
              </Button>
            </Card>
          </div>
        </div>
      </>
      ) : activeSection === "support" ? (
        <div className="parent-dashboard__workspace-grid parent-dashboard__routine-workspace">
          <div className="parent-dashboard__main-column">
            {isLoadingSupport ? (
              <Card className="parent-dashboard__collection-card" variant="soft">
                <div className="parent-dashboard__section-header">
                  <div>
                  <p className="eyebrow">Routine</p>
                    <h3>Loading Tools</h3>
                  </div>
                </div>
                <p className="page-text">
                  Loading saved routines and today's progress.
                </p>
              </Card>
            ) : null}

            <Card className="parent-dashboard__routine-hero" variant="glow">
              <div>
                <p className="eyebrow">Today&apos;s Routine Check</p>
                <h3>Use this when the day has repeated steps.</h3>
                <p className="page-text">
                  Morning, homework, bedtime, or any daily routine can live here. Add the steps once, then mark what is done today.
                </p>
              </div>
              <div className="parent-dashboard__routine-hero-actions">
                <Button type="button" onClick={scrollToRoutineForm}>
                  Create Routine
                </Button>
                <span>{routineTotals.complete} of {routineTotals.total} steps done today</span>
              </div>
            </Card>

            <Card className="parent-dashboard__collection-card parent-dashboard__routine-board" variant="default">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Routines</p>
                  <h3>Manage Routines</h3>
                  <p className="page-text">
                    Open a routine to check off steps, add new steps, or remove routines you no longer use.
                  </p>
                </div>
                <Badge tone="sky">{routineBlocks.length} Routines</Badge>
              </div>

              <div className="parent-dashboard__routine-summary">
                <div>
                  <span>Total Items</span>
                  <strong>{totalRoutineItems}</strong>
                </div>
                <div>
                  <span>Done Today</span>
                  <strong>{routineTotals.complete}</strong>
                </div>
                <div>
                  <span>Today</span>
                  <strong>{routineConsistency}%</strong>
                </div>
              </div>

              {routineActionMessage ? (
                <p className="parent-dashboard__message">{routineActionMessage}</p>
              ) : null}

              {nextRoutineItem ? (
                <div className="parent-dashboard__routine-next">
                  <span aria-hidden="true">
                    <OpenMojiIcon name="hourglass" />
                  </span>
                  <div>
                    <p>Next step to help with</p>
                    <strong>{nextRoutineItem.title}</strong>
                    <p>
                      {nextRoutineItem.routineTitle}
                      {nextRoutineItem.reminder_time
                        ? ` at ${String(nextRoutineItem.reminder_time).slice(0, 5)}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : routineTotals.total > 0 ? (
                <div className="parent-dashboard__routine-next parent-dashboard__routine-next--done">
                  <span aria-hidden="true">
                    <OpenMojiIcon name="check" />
                  </span>
                  <div>
                    <strong>All routine steps are done today.</strong>
                    <p>Use Undo on any step if it was marked done by mistake.</p>
                  </div>
                </div>
              ) : null}

              {routineBlocks.length > 0 ? (
                <div className="parent-dashboard__routine-list">
                  {routineBlocks.map((routine) => {
                    const routineTotal = Number(routine.total_count || routine.items?.length || 0);
                    const routineDone = Number(routine.completed_count || 0);

                    return (
                      <div key={routine.routine_id} className="parent-dashboard__routine-block">
                        <div className="parent-dashboard__routine-block-header">
                          <div>
                            <h4>{routine.title}</h4>
                            <p>{routine.description || "No extra note added."}</p>
                          </div>
                          <Badge tone={routineDone === routineTotal && routineTotal > 0 ? "mint" : "warm"}>
                            {routineDone}/{routineTotal} Today
                          </Badge>
                        </div>

                        <ProgressBar
                          value={routineDone}
                          max={Math.max(routineTotal, 1)}
                          label={`${routine.title} routine progress`}
                        />

                        <div className="parent-dashboard__routine-block-actions">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedRoutineId(String(routine.routine_id));
                              scrollToRoutineItemForm();
                            }}
                          >
                            Add Step
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteRoutine(routine)}
                            disabled={deletingRoutineId === routine.routine_id}
                          >
                            <OpenMojiIcon name="trash" className="parent-dashboard__button-icon" />
                            {deletingRoutineId === routine.routine_id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>

                        {routine.items?.length > 0 ? (
                          <div className="parent-dashboard__routine-items">
                            {routine.items.map((item) => (
                              <div key={item.item_id} className="parent-dashboard__routine-item-row">
                                <span className="parent-dashboard__routine-item-status" aria-hidden="true">
                                  <OpenMojiIcon name={item.is_completed ? "check" : "calendar"} />
                                </span>
                                <div>
                                  <strong>{item.title}</strong>
                                  {item.description ? <p>{item.description}</p> : null}
                                </div>
                                <Badge tone={item.reminder_time ? "warm" : "default"}>
                                  {item.reminder_time
                                    ? String(item.reminder_time).slice(0, 5)
                                    : "Any time"}
                                </Badge>
                                <div className="parent-dashboard__routine-item-actions">
                                  <Button
                                    type="button"
                                    variant={item.is_completed ? "secondary" : "primary"}
                                    size="sm"
                                    onClick={() => handleToggleRoutineItem(routine.routine_id, item)}
                                    disabled={updatingRoutineItemId === item.item_id}
                                  >
                                    {updatingRoutineItemId === item.item_id
                                      ? "Saving..."
                                      : item.is_completed
                                        ? "Undo"
                                        : "Done Today"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDeleteRoutineItem(routine.routine_id, item)}
                                    disabled={deletingRoutineItemId === item.item_id}
                                  >
                                    {deletingRoutineItemId === item.item_id ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="page-text">No steps have been added to this routine yet.</p>
                        )}
                      </div>
                    );
                  })}
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
                  <h4>No Routines Yet</h4>
                  <p>Create a routine for a regular part of the day, then add the steps your child needs.</p>
                </div>
              )}
            </Card>

            <Card className="parent-dashboard__collection-card parent-dashboard__routine-note-card" variant="soft">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">How It Works</p>
                  <h3>Routine Steps</h3>
                </div>
              </div>
              <div className="parent-dashboard__insight-notes">
                <p>Create a routine for a regular part of the day, like morning or bedtime.</p>
                <p>Add small items inside it so the routine is easy to follow.</p>
                <p>Mark each item Done Today when your child finishes it.</p>
                <p>Use Undo if an item was marked done by mistake.</p>
              </div>
            </Card>

          </div>

          <div className="parent-dashboard__side-column">
            <Card
              id="add-routine-form"
              className="parent-dashboard__form-card parent-dashboard__form-card--feature parent-dashboard__routine-form-card"
              variant="glow"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">New Routine</p>
                  <h3>Create A Daily Checklist</h3>
                  <p className="page-text">
                    Start with one routine, like Morning, After School, or Bedtime.
                  </p>
                </div>
              </div>

              <div className="parent-dashboard__form-grid parent-dashboard__routine-form-grid">
                <input
                  type="text"
                  placeholder="Routine name, e.g. Bedtime"
                  value={routineTitle}
                  onChange={(event) => setRoutineTitle(event.target.value)}
                />

                <textarea
                  placeholder="Parent note (optional)"
                  value={routineDescription}
                  onChange={(event) => setRoutineDescription(event.target.value)}
                  rows={3}
                />

                <input
                  type="text"
                  placeholder="First step, e.g. Brush teeth"
                  value={routineItemTitle}
                  onChange={(event) => setRoutineItemTitle(event.target.value)}
                />

                <input
                  type="time"
                  aria-label="First step time"
                  value={routineItemReminder}
                  onChange={(event) => setRoutineItemReminder(event.target.value)}
                />

                {routineMessage ? (
                  <p className="parent-dashboard__message">{routineMessage}</p>
                ) : (
                  <p className="parent-dashboard__helper-text">
                    The time is optional. Leave it blank if the step can happen any time.
                  </p>
                )}

                <Button onClick={handleCreateRoutine} disabled={!hasChildAccount}>
                  Create Routine
                </Button>
              </div>
            </Card>
            <Card
              id="add-routine-item-form"
              className="parent-dashboard__form-card parent-dashboard__routine-form-card"
              variant="default"
            >
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Add Step</p>
                  <h3>Add To An Existing Routine</h3>
                  <p className="page-text">
                    Choose a routine, then add the next small step your child should follow.
                  </p>
                </div>
              </div>

              <div className="parent-dashboard__form-grid">
                <select
                  value={selectedRoutineId}
                  onChange={(event) => setSelectedRoutineId(event.target.value)}
                >
                  <option value="">Choose a routine</option>
                  {routineBlocks.map((routine) => (
                    <option key={routine.routine_id} value={routine.routine_id}>
                      {routine.title}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Step name, e.g. Get ready for school"
                  value={existingRoutineItemTitle}
                  onChange={(event) => setExistingRoutineItemTitle(event.target.value)}
                />

                <textarea
                  placeholder="Helpful note (optional)"
                  value={existingRoutineItemDescription}
                  onChange={(event) => setExistingRoutineItemDescription(event.target.value)}
                  rows={3}
                />

                <input
                  type="time"
                  aria-label="Step time"
                  value={existingRoutineItemReminder}
                  onChange={(event) => setExistingRoutineItemReminder(event.target.value)}
                />

                {routineItemMessage ? (
                  <p className="parent-dashboard__message">{routineItemMessage}</p>
                ) : (
                  <p className="parent-dashboard__helper-text">
                    Add one step at a time so the routine stays easy to follow.
                  </p>
                )}

                <Button onClick={handleCreateRoutineItemForExistingRoutine} disabled={!hasChildAccount}>
                  Add Step
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ParentDashboard;
