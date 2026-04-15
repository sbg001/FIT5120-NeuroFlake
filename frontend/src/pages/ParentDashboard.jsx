import { useEffect, useState } from "react";
import InfoCard from "../components/ui/InfoCard";
import {
  getParentProfile,
  getChildProfile,
  getTasks,
  getTaskSteps,
  getPointsBalance,
  createTask,
  createTaskStep,
  updateTaskStepCount,
  updateTask,
  updateTaskStep,
  deleteTask,
  deleteTaskStep,
  resetTaskStatus,
  getAllRewardsForParent,
  createParentReward,
  updateParentReward,
  deleteParentReward,
} from "../services";

function ParentDashboard() {
  const [parentProfile, setParentProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pointsData, setPointsData] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priorityType, setPriorityType] = useState("");
  const [priorityRank, setPriorityRank] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [stepOrder, setStepOrder] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [visualHint, setVisualHint] = useState("");
  const [exampleText, setExampleText] = useState("");
  const [stepMessage, setStepMessage] = useState("");

  const [editTaskId, setEditTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriorityType, setEditPriorityType] = useState("");
  const [editPriorityRank, setEditPriorityRank] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [editStepTaskId, setEditStepTaskId] = useState("");
  const [editableSteps, setEditableSteps] = useState([]);
  const [editStepId, setEditStepId] = useState("");
  const [editStepOrder, setEditStepOrder] = useState("");
  const [editStepTitle, setEditStepTitle] = useState("");
  const [editStepDescription, setEditStepDescription] = useState("");
  const [editVisualHint, setEditVisualHint] = useState("");
  const [editExampleText, setEditExampleText] = useState("");
  const [editStepMessage, setEditStepMessage] = useState("");

  const [deleteTaskId, setDeleteTaskId] = useState("");
  const [deleteTaskMessage, setDeleteTaskMessage] = useState("");

  const [deleteStepTaskId, setDeleteStepTaskId] = useState("");
  const [deletableSteps, setDeletableSteps] = useState([]);
  const [deleteStepId, setDeleteStepId] = useState("");
  const [deleteStepMessage, setDeleteStepMessage] = useState("");

  const [resetTaskId, setResetTaskId] = useState("");
  const [resetTaskMessage, setResetTaskMessage] = useState("");

  const [rewards, setRewards] = useState([]);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardEmoji, setRewardEmoji] = useState("🎁");
  const [rewardCost, setRewardCost] = useState("");
  const [rewardTheme, setRewardTheme] = useState("");
  const [rewardApproved, setRewardApproved] = useState(true);
  const [rewardMessage, setRewardMessage] = useState("");

  const [editRewardId, setEditRewardId] = useState("");
  const [editRewardTitle, setEditRewardTitle] = useState("");
  const [editRewardEmoji, setEditRewardEmoji] = useState("🎁");
  const [editRewardCost, setEditRewardCost] = useState("");
  const [editRewardTheme, setEditRewardTheme] = useState("");
  const [editRewardApproved, setEditRewardApproved] = useState(true);
  const [editRewardMessage, setEditRewardMessage] = useState("");

  const [deleteRewardId, setDeleteRewardId] = useState("");
  const [deleteRewardMessage, setDeleteRewardMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      const parentResult = await getParentProfile();
      const childResult = await getChildProfile();
      const tasksResult = await getTasks();
      const pointsResult = await getPointsBalance();
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

  const inputStyle = {
    padding: "0.85rem 1rem",
    borderRadius: "14px",
    border: "1px solid #d8dbe8",
    fontSize: "1rem",
    width: "100%",
  };

  const sectionStyle = {
    display: "grid",
    gap: "1rem",
  };

  const handleCreateTask = async () => {
    setCreateMessage("");

    if (!title || !description || !priorityType || !priorityRank) {
      setCreateMessage("Please complete all task fields.");
      return;
    }

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
      return;
    }

    await refreshTasks();

    setTitle("");
    setDescription("");
    setPriorityType("");
    setPriorityRank("");
    setCreateMessage("Task created successfully.");
  };

  const handleSelectEditTask = (taskId) => {
    setEditTaskId(taskId);

    const selectedTask = tasks.find((task) => task.task_id === taskId);
    if (!selectedTask) return;

    setEditTitle(selectedTask.title || "");
    setEditDescription(selectedTask.description || "");
    setEditPriorityType(selectedTask.priority_type || "");
    setEditPriorityRank(selectedTask.priority_rank || "");
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

  const handleCreateStep = async () => {
    setStepMessage("");

    if (!selectedTaskId || !stepOrder || !stepTitle) {
      setStepMessage("Please complete the required step fields.");
      return;
    }

    const existingStepsResult = await getTaskSteps(selectedTaskId);
    const existingSteps = existingStepsResult.data || [];

    if (existingSteps.length >= 5) {
      setStepMessage("This task can only have 2 to 5 simple steps.");
      return;
    }

    if (stepTitle.trim().length > 40) {
      setStepMessage("Step title should be short and simple.");
      return;
    }

    if (stepDescription && stepDescription.trim().length > 120) {
      setStepMessage("Step description should be simple and easy to read.");
      return;
    }

    const result = await createTaskStep({
      task_id: selectedTaskId,
      step_order: Number(stepOrder),
      step_title: stepTitle.trim(),
      step_description: stepDescription.trim(),
      visual_hint: visualHint.trim(),
      example_text: exampleText.trim(),
      is_completed: false,
      completed_at: null,
    });

    if (result.error) {
      setStepMessage("Failed to create step.");
      return;
    }

    await updateTaskStepCount(selectedTaskId);
    await refreshTasks();

    setSelectedTaskId("");
    setStepOrder("");
    setStepTitle("");
    setStepDescription("");
    setVisualHint("");
    setExampleText("");
    setStepMessage("Step created successfully.");
  };

  const handleSelectEditStepTask = async (taskId) => {
    setEditStepTaskId(taskId);
    setEditStepId("");
    setEditStepOrder("");
    setEditStepTitle("");
    setEditStepDescription("");
    setEditVisualHint("");
    setEditExampleText("");
    setEditStepMessage("");

    if (!taskId) {
      setEditableSteps([]);
      return;
    }

    const result = await getTaskSteps(taskId);
    setEditableSteps(result.data || []);
  };

  const handleSelectEditStep = (stepId) => {
    setEditStepId(stepId);

    const selectedStep = editableSteps.find((step) => step.step_id === stepId);
    if (!selectedStep) return;

    setEditStepOrder(selectedStep.step_order || "");
    setEditStepTitle(selectedStep.step_title || "");
    setEditStepDescription(selectedStep.step_description || "");
    setEditVisualHint(selectedStep.visual_hint || "");
    setEditExampleText(selectedStep.example_text || "");
    setEditStepMessage("");
  };

  const handleUpdateStep = async () => {
    setEditStepMessage("");

    if (!editStepId || !editStepOrder || !editStepTitle) {
      setEditStepMessage("Please complete the required edit step fields.");
      return;
    }

    if (editStepTitle.trim().length > 40) {
      setEditStepMessage("Step title should be short and simple.");
      return;
    }

    if (editStepDescription && editStepDescription.trim().length > 120) {
      setEditStepMessage("Step description should be simple and easy to read.");
      return;
    }

    const result = await updateTaskStep(editStepId, {
      step_order: Number(editStepOrder),
      step_title: editStepTitle.trim(),
      step_description: editStepDescription.trim(),
      visual_hint: editVisualHint.trim(),
      example_text: editExampleText.trim(),
    });

    if (result.error) {
      setEditStepMessage("Failed to update step.");
      return;
    }

    const refreshedSteps = await getTaskSteps(editStepTaskId);
    setEditableSteps(refreshedSteps.data || []);
    setEditStepMessage("Step updated successfully.");
  };

  const handleSelectDeleteStepTask = async (taskId) => {
    setDeleteStepTaskId(taskId);
    setDeleteStepId("");
    setDeleteStepMessage("");

    if (!taskId) {
      setDeletableSteps([]);
      return;
    }

    const result = await getTaskSteps(taskId);
    setDeletableSteps(result.data || []);
  };

  const handleDeleteStep = async () => {
    setDeleteStepMessage("");

    if (!deleteStepId || !deleteStepTaskId) {
      setDeleteStepMessage("Please select a step to delete.");
      return;
    }

    const result = await deleteTaskStep(deleteStepId);

    if (result.error) {
      setDeleteStepMessage("Failed to delete step.");
      return;
    }

    await updateTaskStepCount(deleteStepTaskId);

    const refreshedSteps = await getTaskSteps(deleteStepTaskId);
    setDeletableSteps(refreshedSteps.data || []);
    await refreshTasks();

    setDeleteStepId("");
    setDeleteStepMessage("Step deleted successfully.");
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
    setRewardEmoji("🎁");
    setRewardCost("");
    setRewardTheme("");
    setRewardApproved(true);
    setRewardMessage("Reward created successfully.");
  };

  const handleSelectEditReward = (rewardId) => {
    setEditRewardId(rewardId);
    const reward = rewards.find((item) => String(item.id) === String(rewardId));
    if (!reward) return;

    setEditRewardTitle(reward.title || "");
    setEditRewardEmoji(reward.emoji || "🎁");
    setEditRewardCost(reward.cost || "");
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

  if (!parentProfile || !childProfile || !pointsData) {
    return (
      <section className="page-section">
        <p>Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Parent Dashboard</p>
        <h2 className="page-title">Welcome, {parentProfile.name}</h2>
        <p className="page-text">
          A simple overview to support {childProfile.name} with tasks, structure, and motivation.
        </p>
      </div>

      <div className="card-grid">
        <InfoCard title="Support Goals">
          <p>Support independence</p>
          <p>Reduce reminder overload</p>
          <p>Track task progress clearly</p>
        </InfoCard>

        <InfoCard title="Task Overview">
          <p>Total tasks: {tasks.length}</p>
          <p>Ready tasks: {tasks.filter((task) => task.status !== "completed").length}</p>
        </InfoCard>

        <InfoCard title="Reward Overview">
          <p>Total rewards: {rewards.length}</p>
          <p>Current points: {pointsData.points_balance}</p>
        </InfoCard>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Create Task</h3>
          <p className="page-text" style={{ marginTop: 0 }}>
            Create the main task first, then add 2 to 5 short and simple steps below.
          </p>

          <div style={sectionStyle}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <select
              value={priorityType}
              onChange={(e) => setPriorityType(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select priority type</option>
              <option value="importance">Importance</option>
              <option value="urgency">Urgency</option>
              <option value="happiness">Happiness</option>
            </select>

            <select
              value={priorityRank}
              onChange={(e) => setPriorityRank(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select priority rank</option>
              <option value="1">1 - Low</option>
              <option value="2">2 - Medium</option>
              <option value="3">3 - High</option>
            </select>

            {createMessage && <p className="page-text" style={{ margin: 0 }}>{createMessage}</p>}

            <div>
              <button className="primary-button" onClick={handleCreateTask}>
                Create Task
              </button>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Reset Task Status</h3>
          <p className="page-text" style={{ marginTop: 0 }}>
            Reset makes the task pending again and clears all completed steps.
          </p>

          <div style={sectionStyle}>
            <select
              value={resetTaskId}
              onChange={(e) => setResetTaskId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task to reset</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            {resetTaskMessage && <p className="page-text" style={{ margin: 0 }}>{resetTaskMessage}</p>}

            <div>
              <button className="secondary-button" onClick={handleResetTask}>
                Reset Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Edit Task</h3>

          <div style={sectionStyle}>
            <select
              value={editTaskId}
              onChange={(e) => handleSelectEditTask(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task to edit</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Edit task title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Edit task description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <select
              value={editPriorityType}
              onChange={(e) => setEditPriorityType(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select priority type</option>
              <option value="importance">Importance</option>
              <option value="urgency">Urgency</option>
              <option value="happiness">Happiness</option>
            </select>

            <select
              value={editPriorityRank}
              onChange={(e) => setEditPriorityRank(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select priority rank</option>
              <option value="1">1 - Low</option>
              <option value="2">2 - Medium</option>
              <option value="3">3 - High</option>
            </select>

            {editMessage && <p className="page-text" style={{ margin: 0 }}>{editMessage}</p>}

            <div>
              <button className="primary-button" onClick={handleUpdateTask}>
                Update Task
              </button>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Delete Task</h3>
          <p className="page-text" style={{ marginTop: 0 }}>
            Deleting a task will also remove all of its steps.
          </p>

          <div style={sectionStyle}>
            <select
              value={deleteTaskId}
              onChange={(e) => setDeleteTaskId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task to delete</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            {deleteTaskMessage && <p className="page-text" style={{ margin: 0 }}>{deleteTaskMessage}</p>}

            <div>
              <button className="secondary-button" onClick={handleDeleteTask}>
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Add Step</h3>
          <p className="page-text" style={{ marginTop: 0 }}>
            Add 2 to 5 short, simple steps for each task.
          </p>

          <div style={sectionStyle}>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Step order"
              value={stepOrder}
              onChange={(e) => setStepOrder(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Step title"
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Step description"
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <input
              type="text"
              placeholder="Visual hint (example: 🎒)"
              value={visualHint}
              onChange={(e) => setVisualHint(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Example text"
              value={exampleText}
              onChange={(e) => setExampleText(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            {stepMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {stepMessage}
              </p>
            )}

            <div>
              <button className="primary-button" onClick={handleCreateStep}>
                Add Step
              </button>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Edit Step</h3>

          <div style={sectionStyle}>
            <select
              value={editStepTaskId}
              onChange={(e) => handleSelectEditStepTask(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task for step editing</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            <select
              value={editStepId}
              onChange={(e) => handleSelectEditStep(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select step to edit</option>
              {editableSteps.map((step) => (
                <option key={step.step_id} value={step.step_id}>
                  {step.step_title}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Edit step order"
              value={editStepOrder}
              onChange={(e) => setEditStepOrder(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Edit step title"
              value={editStepTitle}
              onChange={(e) => setEditStepTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Edit step description"
              value={editStepDescription}
              onChange={(e) => setEditStepDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <input
              type="text"
              placeholder="Edit visual hint"
              value={editVisualHint}
              onChange={(e) => setEditVisualHint(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Edit example text"
              value={editExampleText}
              onChange={(e) => setEditExampleText(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            {editStepMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {editStepMessage}
              </p>
            )}

            <div>
              <button className="primary-button" onClick={handleUpdateStep}>
                Update Step
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Delete Step</h3>

          <div style={sectionStyle}>
            <select
              value={deleteStepTaskId}
              onChange={(e) => handleSelectDeleteStepTask(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select task for step deletion</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>

            <select
              value={deleteStepId}
              onChange={(e) => setDeleteStepId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select step to delete</option>
              {deletableSteps.map((step) => (
                <option key={step.step_id} value={step.step_id}>
                  {step.step_title}
                </option>
              ))}
            </select>

            {deleteStepMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {deleteStepMessage}
              </p>
            )}

            <div>
              <button className="secondary-button" onClick={handleDeleteStep}>
                Delete Step
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Create Reward</h3>

          <div style={sectionStyle}>
            <input
              type="text"
              placeholder="Reward title"
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Emoji"
              value={rewardEmoji}
              onChange={(e) => setRewardEmoji(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Points cost"
              value={rewardCost}
              onChange={(e) => setRewardCost(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Theme"
              value={rewardTheme}
              onChange={(e) => setRewardTheme(e.target.value)}
              style={inputStyle}
            />

            <select
              value={rewardApproved ? "true" : "false"}
              onChange={(e) => setRewardApproved(e.target.value === "true")}
              style={inputStyle}
            >
              <option value="true">Approved</option>
              <option value="false">Not approved</option>
            </select>

            {rewardMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {rewardMessage}
              </p>
            )}

            <div>
              <button className="primary-button" onClick={handleCreateReward}>
                Create Reward
              </button>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Edit Reward</h3>

          <div style={sectionStyle}>
            <select
              value={editRewardId}
              onChange={(e) => handleSelectEditReward(e.target.value)}
              style={inputStyle}
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
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Edit emoji"
              value={editRewardEmoji}
              onChange={(e) => setEditRewardEmoji(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Edit points cost"
              value={editRewardCost}
              onChange={(e) => setEditRewardCost(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Edit theme"
              value={editRewardTheme}
              onChange={(e) => setEditRewardTheme(e.target.value)}
              style={inputStyle}
            />

            <select
              value={editRewardApproved ? "true" : "false"}
              onChange={(e) => setEditRewardApproved(e.target.value === "true")}
              style={inputStyle}
            >
              <option value="true">Approved</option>
              <option value="false">Not approved</option>
            </select>

            {editRewardMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {editRewardMessage}
              </p>
            )}

            <div>
              <button className="primary-button" onClick={handleUpdateReward}>
                Update Reward
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Delete Reward</h3>

          <div style={sectionStyle}>
            <select
              value={deleteRewardId}
              onChange={(e) => setDeleteRewardId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select reward to delete</option>
              {rewards.map((reward) => (
                <option key={reward.id} value={reward.id}>
                  {reward.title}
                </option>
              ))}
            </select>

            {deleteRewardMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {deleteRewardMessage}
              </p>
            )}

            <div>
              <button className="secondary-button" onClick={handleDeleteReward}>
                Delete Reward
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ParentDashboard;