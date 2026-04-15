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

    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);

    setEditMessage("Task updated successfully.");
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

    const result = await updateTaskStep(editStepId, {
      step_order: Number(editStepOrder),
      step_title: editStepTitle,
      step_description: editStepDescription,
      visual_hint: editVisualHint,
      example_text: editExampleText,
    });

    if (result.error) {
      setEditStepMessage("Failed to update step.");
      return;
    }

    const refreshedSteps = await getTaskSteps(editStepTaskId);
    setEditableSteps(refreshedSteps.data || []);

    setEditStepMessage("Step updated successfully.");
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

    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);

    setDeleteTaskId("");
    setDeleteTaskMessage("Task deleted successfully.");
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

    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks.data || []);

    setDeleteStepId("");
    setDeleteStepMessage("Step deleted successfully.");
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
          <h4 style={{ margin: 0 }}>Edit existing task</h4>

          <select
            value={editTaskId}
            onChange={(e) => handleSelectEditTask(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Edit task description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
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
            value={editPriorityType}
            onChange={(e) => setEditPriorityType(e.target.value)}
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
            value={editPriorityRank}
            onChange={(e) => setEditPriorityRank(e.target.value)}
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

          {editMessage && (
            <p className="page-text" style={{ margin: 0 }}>
              {editMessage}
            </p>
          )}

          <div>
            <button className="primary-button" onClick={handleUpdateTask}>
              Update Task
            </button>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
          <h4 style={{ margin: 0 }}>Delete task</h4>

          <select
            value={deleteTaskId}
            onChange={(e) => setDeleteTaskId(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          >
            <option value="">Select task to delete</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.title}
              </option>
            ))}
          </select>

          {deleteTaskMessage && (
            <p className="page-text" style={{ margin: 0 }}>
              {deleteTaskMessage}
            </p>
          )}

          <div>
            <button className="primary-button" onClick={handleDeleteTask}>
              Delete Task
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

        <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
          <h4 style={{ margin: 0 }}>Edit existing step</h4>

          <select
            value={editStepTaskId}
            onChange={(e) => handleSelectEditStepTask(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <input
            type="text"
            placeholder="Edit step title"
            value={editStepTitle}
            onChange={(e) => setEditStepTitle(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Edit step description"
            value={editStepDescription}
            onChange={(e) => setEditStepDescription(e.target.value)}
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
            placeholder="Edit visual hint"
            value={editVisualHint}
            onChange={(e) => setEditVisualHint(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
          />

          <textarea
            placeholder="Edit example text"
            value={editExampleText}
            onChange={(e) => setEditExampleText(e.target.value)}
            rows={2}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
              resize: "vertical",
            }}
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

        <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
          <h4 style={{ margin: 0 }}>Delete step</h4>

          <select
            value={deleteStepTaskId}
            onChange={(e) => handleSelectDeleteStepTask(e.target.value)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "14px",
              border: "1px solid #d8dbe8",
              fontSize: "1rem",
            }}
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
            <button className="primary-button" onClick={handleDeleteStep}>
              Delete Step
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ParentDashboard;