import { useEffect, useState } from "react";
import { getTaskById, getTaskSteps, completeStep, completeTask } from "../services";
import { useNavigate, useParams } from "react-router-dom";

function TaskFlow() {
  const [task, setTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTask() {
      setLoading(true);

      const { data: taskData } = await getTaskById(taskId);
      const { data: stepsData } = await getTaskSteps(taskId);

      setTask(taskData);
      setSteps(stepsData || []);
      setCurrentStepIndex(0);
      setLoading(false);
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const currentStep = steps[currentStepIndex];

  const handleNext = async () => {
    if (!currentStep) return;

    await completeStep(taskId, currentStep.step_id);

    if (currentStepIndex < steps.length - 1) {
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

      setCurrentStepIndex((prev) => prev + 1);
    } else {
      await completeTask(taskId);

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

      navigate("/rewards");
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

  return (
    <section className="page-section">
      <div className="content-card">
        <p className="eyebrow">Task Flow</p>
        <h2 className="page-title">{task.title}</h2>
        <p className="page-text">{task.description}</p>

        <p className="page-text">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {currentStep && (
        <div className="hero-card">
          <h3>{currentStep.step_title}</h3>
          <p>{currentStep.step_description}</p>

          <div className="button-row">
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={task.status === "completed"}
            >
              {currentStepIndex === steps.length - 1
                ? task.status === "completed"
                  ? "Task Completed"
                  : "Finish Task"
                : "Next Step"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskFlow;