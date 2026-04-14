import { useEffect, useState } from "react";
import { getTaskById, getTaskSteps } from "../services";
import { useParams } from "react-router-dom";

function TaskFlow() {
  const [task, setTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const { taskId } = useParams();

  useEffect(() => {
    async function loadTask() {
      setLoading(true);

      const { data: taskData } = await getTaskById(taskId);
      const { data: stepsData } = await getTaskSteps(taskId);

      setTask(taskData);
      setSteps(stepsData || []);
      setCurrentStepIndex(0); // ✅ reset step

      setLoading(false);
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

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
              disabled={currentStepIndex === steps.length - 1}
            >
              {currentStepIndex === steps.length - 1
                ? "Finish Task"
                : "Next Step"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskFlow;