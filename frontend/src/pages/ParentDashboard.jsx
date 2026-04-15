import { useEffect, useState } from "react";
import InfoCard from "../components/ui/InfoCard";
import {
  getParentProfile,
  getChildProfile,
  getTasks,
  getPointsBalance,
  createTask,
  createTaskStep,
  updateTaskStepCount,
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

  useEffect(() => {
    async function loadDashboardData() {
      const parentResult = await getParentProfile();
      const childResult = await getChildProfile();
      const tasksResult = await getTasks();
      const pointsResult = await getPointsBalance();

      setParentProfile(parentResult.data);
      setChildProfile(childResult.data);
      setTasks(tasksResult.data || []);
      setPointsData(pointsResult.data);
    }

    loadDashboardData();
  }, []);

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

    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);

    setTitle("");
    setDescription("");
    setPriorityType("");
    setPriorityRank("");
    setCreateMessage("Task created successfully.");
  };

  const handleCreateStep = async () => {
    setStepMessage("");

    if (!selectedTaskId || !stepOrder || !stepTitle) {
      setStepMessage("Please complete the required step fields.");
      return;
    }

    const result = await createTaskStep({
      task_id: selectedTaskId,
      step_order: Number(stepOrder),
      step_title: stepTitle,
      step_description: stepDescription,
      visual_hint: visualHint,
      example_text: exampleText,
      is_completed: false,
      completed_at: null,
    });

    if (result.error) {
      setStepMessage("Failed to create step.");
      return;
    }

    await updateTaskStepCount(selectedTaskId);

    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);

    setSelectedTaskId("");
    setStepOrder("");
    setStepTitle("");
    setStepDescription("");
    setVisualHint("");
    setExampleText("");
    setStepMessage("Step created successfully.");
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
          <p>Available rewards: Coming soon</p>
          <p>Current points: {pointsData.points_balance}</p>
        </InfoCard>
      </div>

      <div className="content-card">
        <h3>Parent control space</h3>
        <p>
          This area is ready for task creation, step editing, and reward controls in later user stories.
        </p>

        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />

          <select
            value={priorityType}
            onChange={(e) => setPriorityType(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          >
            <option value="">Select priority type</option>
            <option value="importance">Importance</option>
            <option value="urgency">Urgency</option>
            <option value="happiness">Happiness</option>
          </select>

          <select
            value={priorityRank}
            onChange={(e) => setPriorityRank(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          >
            <option value="">Select priority rank</option>
            <option value="1">1 - Low</option>
            <option value="2">2 - Medium</option>
            <option value="3">3 - High</option>
          </select>

          {createMessage && (
            <p className="page-text" style={{ margin: 0 }}>
              {createMessage}
            </p>
          )}

          <div>
            <button className="primary-button" onClick={handleCreateTask}>
              Create Task
            </button>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
          <h4 style={{ margin: 0 }}>Add step to task</h4>

          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <input
            type="text"
            placeholder="Step title"
            value={stepTitle}
            onChange={(e) => setStepTitle(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Step description"
            value={stepDescription}
            onChange={(e) => setStepDescription(e.target.value)}
            rows={2}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />

          <input
            type="text"
            placeholder="Visual hint (example: 🎒)"
            value={visualHint}
            onChange={(e) => setVisualHint(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Example text"
            value={exampleText}
            onChange={(e) => setExampleText(e.target.value)}
            rows={2}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
              resize: "vertical",
            }}
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
    </section>
  );
}

export default ParentDashboard;