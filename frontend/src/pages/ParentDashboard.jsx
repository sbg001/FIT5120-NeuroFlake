import { useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import {
  createChildAccount,
  createParentReward,
  createRewardTransaction,
  createTask,
  createTaskStep,
  deleteParentReward,
  deleteTask,
  deleteTaskStep,
  getAllRewardsForParent,
  getChildProfile,
  getLatestRewardSummary,
  getParentApprovedRewards,
  getParentProfile,
  getPointsBalance,
  getRewardTransactions,
  getSensoryRiskPrediction,
  getTaskSteps,
  getTasks,
  updateParentReward,
  updatePointsBalance,
  updateTask,
  updateTaskStep,
  updateTaskStepCount,
  generateTaskSteps,
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
  const [childAccountName, setChildAccountName] = useState("");
  const [childAccountAge, setChildAccountAge] = useState("");
  const [childAccountUsername, setChildAccountUsername] = useState("");
  const [childAccountPassword, setChildAccountPassword] = useState("");
  const [childAccountMessage, setChildAccountMessage] = useState("");

  const [weeklyData] = useState([
    { day: "Mon", happy: 4, overwhelmed: 1 },
    { day: "Tue", happy: 3, overwhelmed: 2 },
    { day: "Wed", happy: 5, overwhelmed: 0 },
    { day: "Thu", happy: 2, overwhelmed: 3 },
    { day: "Fri", happy: 4, overwhelmed: 1 },
    { day: "Sat", happy: 6, overwhelmed: 0 },
    { day: "Sun", happy: 5, overwhelmed: 1 },
  ]);

  const hasChildAccount = Boolean(childProfile?.user_id);

  useEffect(() => {
    async function loadDashboardData() {
      const parentResult = await getParentProfile();
      const childResult = await getChildProfile();
      const tasksResult = await getTasks();
      const pointsResult = childResult.data
        ? await getPointsBalance(childResult.data.user_id)
        : { data: { points_balance: 0 }, error: null };
      const rewardsResult = await getAllRewardsForParent();

      setParentProfile(parentResult.data);
      setChildProfile(childResult.data);
      setTasks(tasksResult.data || []);
      setPointsData(pointsResult.data);
      setRewards(rewardsResult.data || []);
    }

    loadDashboardData();
  }, []);

  const refreshTasks = async () => {
    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);
  };

  const refreshRewards = async () => {
    const rewardsResult = await getAllRewardsForParent();
    setRewards(rewardsResult.data || []);
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
  setPointsData({ points_balance: 0 });
  setTasks([]);
  setChildAccountName("");
  setChildAccountAge("");
  setChildAccountUsername("");
  setChildAccountPassword("");
  setChildAccountMessage(
    "Child account created successfully. The child can now sign in with their username and password."
  );
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

  if (!parentProfile || !pointsData) {
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

  return (
    <section className="page-section parent-dashboard">
      <PageHeader
        eyebrow="Parent Dashboard"
        title={`Welcome, ${parentProfile.name}`}
        description={
          hasChildAccount
            ? `A calm control center for managing ${childProfile.name}'s tasks, progress, rewards, and support insights.`
            : "Create a child account first to start managing tasks, rewards, and support insights."
        }
      />
      {!hasChildAccount ? (
        <Card className="parent-dashboard__collection-card" variant="glow">
          <div className="parent-dashboard__section-header">
            <div>
              <p className="eyebrow">Child Account Required</p>
              <h3>No child account yet</h3>
            </div>
            <Badge tone="warm">Setup needed</Badge>
          </div>
          <p className="page-text">
            Create a child account below before managing tasks, rewards, and progress.
          </p>
        </Card>
      ) : null}
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
            { id: "insights", label: "Insights", note: "View support forecasts and patterns" },
          ].map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                if (section.id === "insights" && !riskForecast) {
                  loadInsights();
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
            <Card className="parent-dashboard__form-card parent-dashboard__form-card--feature" variant="glow">
              <div className="parent-dashboard__section-header">
                <div>
                  <p className="eyebrow">Child Account</p>
                  <h3>Create a child sign in</h3>
                </div>
                <Badge tone="sky">Parent only</Badge>
              </div>

              <p className="page-text">
                Children cannot create accounts by themselves. A parent creates the child profile and sign-in details.
              </p>

              <div className="parent-dashboard__form-grid">
                <input
                  type="text"
                  placeholder="Child name"
                  value={childAccountName}
                  onChange={(e) => setChildAccountName(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Child age"
                  value={childAccountAge}
                  onChange={(e) => setChildAccountAge(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Child username"
                  value={childAccountUsername}
                  onChange={(e) => setChildAccountUsername(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Child password"
                  value={childAccountPassword}
                  onChange={(e) => setChildAccountPassword(e.target.value)}
                />

                {childAccountMessage ? (
                  <p className="parent-dashboard__message">{childAccountMessage}</p>
                ) : null}

                <Button onClick={handleCreateChildAccount}>
                  Create Child Account
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
      ) : (
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
                {weeklyData.map((data) => (
                  <div key={data.day} className="parent-dashboard__chart-day">
                    <div className="parent-dashboard__chart-bars">
                      <div
                        className="parent-dashboard__chart-bar parent-dashboard__chart-bar--happy"
                        style={{ height: `${(data.happy / 6) * 100}%` }}
                        aria-label={`${data.day} happy score ${data.happy}`}
                      />
                      <div
                        className="parent-dashboard__chart-bar parent-dashboard__chart-bar--overwhelmed"
                        style={{ height: `${(data.overwhelmed / 6) * 100}%` }}
                        aria-label={`${data.day} overwhelmed score ${data.overwhelmed}`}
                      />
                    </div>
                    <span>{data.day}</span>
                  </div>
                ))}
              </div>
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
          </div>
        </div>
      )}
    </section>
  );
}

export default ParentDashboard;
