import { useEffect, useState } from "react";
import {
  getTaskById,
  getTaskSteps,
  completeStep,
  completeTask,
  getPointsBalance,
  createRewardTransaction,
  updatePointsBalance,
} from "../services";
import { useNavigate, useParams } from "react-router-dom";

function TaskFlow() {
  const [task, setTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taskReady, setTaskReady] = useState(true);

  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTask() {
      setLoading(true);

      const { data: taskData } = await getTaskById(taskId);
      const { data: stepsData } = await getTaskSteps(taskId);

      const orderedSteps = stepsData || [];
      const validStepCount =
        orderedSteps.length >= 2 && orderedSteps.length <= 5;

      setTask(taskData);
      setSteps(orderedSteps);
      setTaskReady(validStepCount);
      setCurrentStepIndex(0);
      setLoading(false);
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const currentStep = steps[currentStepIndex];
  const progressPercent =
    steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const handleNext = async () => {
    if (!currentStep) return;

    await completeStep(taskId, currentStep.step_id);

    if (currentStepIndex < steps.length - 1) {
      const updatedSteps = steps.map((step, index) =>
        index === currentStepIndex
          ? {
              ...step,
              is_completed: true,
              completed_at: new Date().toISOString(),
            }
          : step
      );

      setSteps(updatedSteps);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      await completeTask(taskId);

      const pointsResult = await getPointsBalance();
      const currentPoints = pointsResult.data?.points_balance ?? 0;
      const earnedPoints = 10;
      const updatedPoints = currentPoints + earnedPoints;

      await createRewardTransaction({
        child_id: task.child_id,
        task_id: task.task_id,
        points_earned: earnedPoints,
        steps_completed: steps.length,
        transaction_type: "earn",
      });

      await updatePointsBalance(task.child_id, updatedPoints);

      setSteps((prevSteps) =>
        prevSteps.map((step, index) =>
          index === currentStepIndex
            ? {
                ...step,
                is_completed: true,
                completed_at: new Date().toISOString(),
              }
            : step
        )
      );

      setTask((prevTask) =>
        prevTask
          ? {
              ...prevTask,
              status: "completed",
            }
          : prevTask
      );

      navigate("/rewards", { state: { showCelebration: true } });
    }
  };

  if (!taskId) {
    return <p className="page-text">No task selected</p>;
  }

  if (loading) {
    return <p className="page-text">Loading task...</p>;
  }

  if (!task) {
    return <p className="page-text">No task available</p>;
  }

  if (!taskReady) {
    return (
      <section className="page-section">
        <div className="content-card">
          <p className="eyebrow">Task Flow</p>
          <h2 className="page-title">{task.title}</h2>
          <p className="page-text">
            This task needs 2 to 5 simple steps before it can start.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="content-card">
        <p className="eyebrow">Task Flow</p>
        <h2 className="page-title">{task.title}</h2>
        <p className="page-text">{task.description}</p>

        <p className="page-text">
          Step {currentStepIndex + 1} of {steps.length}
        </p>

        <div
          style={{
            width: "100%",
            height: "10px",
            backgroundColor: "#e9edf7",
            borderRadius: "999px",
            overflow: "hidden",
            marginTop: "0.75rem",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: "#6c8ff0",
            }}
          />
        </div>
      </div>

      <div className="content-card">
        <p className="eyebrow">Step Plan</p>
        {steps.map((step, index) => (
          <p
            key={step.step_id}
            style={{
              margin: "0.45rem 0",
              fontWeight: index === currentStepIndex ? 700 : 400,
              opacity: step.is_completed ? 0.7 : 1,
            }}
          >
            {step.is_completed ? "✅" : index === currentStepIndex ? "👉" : "•"}{" "}
            {index + 1}. {step.step_title}
          </p>
        ))}
      </div>

      {currentStep && (
        <div className="hero-card">
          <p className="eyebrow">Current Step</p>
          <h3>{currentStep.step_title}</h3>
          <p>{currentStep.step_description}</p>

          {currentStep.visual_hint && (
            <p className="page-text">Visual hint: {currentStep.visual_hint}</p>
          )}

          {currentStep.example_text && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: "16px",
                backgroundColor: "#f8faff",
                border: "1px solid #d8dbe8",
              }}
            >
              <p className="page-text" style={{ margin: 0 }}>
                Try this: {currentStep.example_text}
              </p>
            </div>
          )}

          <p className="page-text" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            Start with this step, then move forward one step at a time.
          </p>

          <div className="button-row">
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!currentStep}
            >
              {currentStepIndex === 0
                ? "Start Task"
                : currentStepIndex === steps.length - 1
                ? task.status === "completed"
                  ? "Task Completed"
                  : "Finish Task"
                : "Mark Step Complete"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskFlow;