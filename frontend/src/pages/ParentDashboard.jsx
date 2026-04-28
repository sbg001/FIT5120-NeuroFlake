import { useEffect, useState } from "react";
import InfoCard from "../components/ui/InfoCard";
import PageHeader from "../components/ui/PageHeader";
import {
  getParentProfile,
  getChildProfile,
  getTasks,
  getPointsBalance,
  createTask,
  createTaskStep,
  updateTaskStepCount,
  updateTask,
  deleteTask,
  resetTaskStatus,
  generateTaskSteps,
  getAllRewardsForParent,
  createParentReward,
  updateParentReward,
  deleteParentReward,
  getSensoryRiskPrediction,
} from "../services";

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

  const [riskForecast, setRiskForecast] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Mocking the weekly emotion data for the chart (In production, fetch this from Supabase!)
  const [weeklyData] = useState([
    { day: "Mon", happy: 4, overwhelmed: 1 },
    { day: "Tue", happy: 3, overwhelmed: 2 },
    { day: "Wed", happy: 5, overwhelmed: 0 },
    { day: "Thu", happy: 2, overwhelmed: 3 },
    { day: "Fri", happy: 4, overwhelmed: 1 },
    { day: "Sat", happy: 6, overwhelmed: 0 },
    { day: "Sun", happy: 5, overwhelmed: 1 },
  ]);

  useEffect(() => {
    async function loadDashboardData() {
      const parentResult = await getParentProfile();
      const childResult = await getChildProfile();
      const tasksResult = await getTasks();
      const pointsResult = await getPointsBalance(childResult.data?.user_id);
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

  const sectionButtonStyle = {
    border: "1px solid #d8dbe8",
    borderRadius: "14px",
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  };

  const handleCreateTask = async () => {
    setCreateMessage("");

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
  useEffect(() => {
    if (activeSection === "insights" && !riskForecast) {
      loadInsights();
    }
  }, [activeSection]);

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    
    // In a real scenario, you would query Supabase for today's actual numbers.
    // We are using realistic mock data here to test the ML engine.
    const todaysTelemetry = {
      hoursSlept: 6.5,          // Borderline sleep
      overwhelmedCount: 2,      // Feeling friction
      tasksAbandoned: 1,        
      tasksCompleted: 3         
    };

    const prediction = await getSensoryRiskPrediction(todaysTelemetry);
    
    if (prediction) {
      setRiskForecast(prediction);
    }
    
    setIsLoadingInsights(false);
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
      <PageHeader
        eyebrow="Parent Dashboard"
        title={`Welcome, ${parentProfile.name}`}
        description={`A simple overview to support ${childProfile.name} with tasks, structure, and motivation.`}
      />

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

      <div
        className="content-card"
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {[
          { id: "tasks", label: "Tasks" },
          { id: "rewards", label: "Rewards" },
          { id: "insights", label:"Behavioral Insights"},
        ].map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            style={{
              ...sectionButtonStyle,
              background: activeSection === section.id ? "#5b8def" : "#f8faff",
              color: activeSection === section.id ? "#ffffff" : "#4476d9",
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === "tasks" && (
        <>
      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
        <div className="content-card">
          <h3>Create Task</h3>
          <p className="page-text" style={{ marginTop: 0 }}>
            Create the main task and NeuroFlake will make 2 to 5 smaller steps.
            You can still edit the steps after.
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
              <button
                className="primary-button"
                onClick={handleCreateTask}
                disabled={isCreatingTask}
              >
                {isCreatingTask ? "Creating Steps..." : "Create Task With Steps"}
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
        </>
      )}


      {activeSection === "rewards" && (
        <>
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
        </>
      )}
      {activeSection === "insights" && (
        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
          
          {/* 1. Sensory Overload Forecast Card */}
          <div className="content-card" style={{ padding: "2rem", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginTop: 0, color: "#1E293B", fontSize: "1.4rem" }}>Sensory Overload Forecast</h3>
                <p style={{ color: "#64748B", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  AI-powered prediction based on today's telemetry (sleep, task completion, and emotion logs).
                </p>
              </div>
              
              {/* Dynamic Risk Badge */}
              {isLoadingInsights ? (
                <div style={{ padding: "0.5rem 1rem", backgroundColor: "#F1F5F9", color: "#64748B", borderRadius: "999px", fontWeight: "bold" }}>Analyzing...</div>
              ) : riskForecast ? (
                <div style={{ 
                  padding: "0.5rem 1.5rem", 
                  borderRadius: "999px", 
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  backgroundColor: riskForecast.risk_level === "Low" ? "#D1FAE5" : riskForecast.risk_level === "Medium" ? "#FEF3C7" : "#FEE2E2",
                  color: riskForecast.risk_level === "Low" ? "#065F46" : riskForecast.risk_level === "Medium" ? "#92400E" : "#991B1B"
                }}>
                  {riskForecast.risk_level} Risk
                </div>
              ) : (
                <div style={{ padding: "0.5rem 1rem", backgroundColor: "#FEE2E2", color: "#EF4444", borderRadius: "999px" }}>Engine Offline</div>
              )}
            </div>

            {/* AI Advisory Text */}
            {riskForecast && (
              <div style={{ marginTop: "1.5rem", padding: "1.5rem", backgroundColor: "#F8FAFC", borderLeft: `4px solid ${riskForecast.risk_level === "Low" ? "#10B981" : riskForecast.risk_level === "Medium" ? "#F59E0B" : "#EF4444"}`, borderRadius: "0 12px 12px 0" }}>
                <p style={{ margin: 0, fontSize: "1.15rem", color: "#334155", lineHeight: "1.6" }}>
                  <strong>AI Advisory:</strong> {riskForecast.advisory_text}
                </p>
              </div>
            )}
          </div>

          {/* 2. Historical Emotion Trends (Native CSS Bar Chart) */}
          <div className="content-card" style={{ padding: "2rem", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", marginTop: "1.5rem" }}>
            <h3 style={{ marginTop: 0, color: "#1E293B", fontSize: "1.3rem" }}>Weekly Emotional Regulation</h3>
            <p style={{ color: "#64748B", marginBottom: "2rem" }}>Tracking reported emotions to identify patterns and triggers over time.</p>
            
            {/* Legend */}
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10B981" }}></div>
                <span style={{ color: "#64748B", fontSize: "0.9rem" }}>Happy / Good</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#EF4444" }}></div>
                <span style={{ color: "#64748B", fontSize: "0.9rem" }}>Overwhelmed</span>
              </div>
            </div>

            {/* CSS Bar Chart */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "200px", borderBottom: "2px solid #E2E8F0", paddingBottom: "0.5rem", gap: "10px" }}>
              {weeklyData.map((data, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  
                  {/* The Bars */}
                  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "180px", width: "100%", justifyContent: "center" }}>
                    {/* Happy Bar */}
                    <div style={{ width: "30%", maxWidth: "20px", height: `${(data.happy / 6) * 100}%`, backgroundColor: "#10B981", borderRadius: "4px 4px 0 0", transition: "height 1s ease-out" }}></div>
                    {/* Overwhelmed Bar */}
                    <div style={{ width: "30%", maxWidth: "20px", height: `${(data.overwhelmed / 6) * 100}%`, backgroundColor: "#EF4444", borderRadius: "4px 4px 0 0", transition: "height 1s ease-out" }}></div>
                  </div>
                  
                  {/* Day Label */}
                  <span style={{ marginTop: "0.5rem", color: "#64748B", fontSize: "0.9rem", fontWeight: "500" }}>{data.day}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </section>
  );
}

export default ParentDashboard;
