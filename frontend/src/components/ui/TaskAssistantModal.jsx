import { useEffect, useState } from "react";
import Button from "./Button";
import Card from "./Card";
import { requestTaskBreakdown } from "../../services";

function TaskAssistantModal({
  isOpen,
  onClose,
  task,
  onSaveSteps,
}) {
  const [steps, setSteps] = useState([]);
  const [companionMessage, setCompanionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userRole = localStorage.getItem("current_user_role");
  const isParent = userRole === "parent";

  useEffect(() => {
    if (isOpen && task) {
      setCompanionMessage(
        isParent
          ? `Drafting a mission plan for "${task.title}".`
          : `Hi! I see we need to work on ${task.title}. Should I help you break this down into easy steps?`
      );
      setSteps([]);
      setErrorMessage("");
    }
  }, [isOpen, task, isParent]);

  if (!isOpen) return null;

  const handleGenerateSteps = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setCompanionMessage(
      isParent
        ? "Thinking... drafting a clear plan."
        : "Scanning my data banks for the best mission plan..."
    );

    try {
      const data = await requestTaskBreakdown(task.title);

      if (data && Array.isArray(data.steps)) {
        setSteps(data.steps);
        setCompanionMessage(
          isParent
            ? "Here is the draft. Edit, add, or remove steps below."
            : data.companion_message || "Here is our mission plan!"
        );
      } else {
        setErrorMessage("Oops! I got my wires crossed.");
        setCompanionMessage("Uh oh, something went wrong.");
      }
    } catch {
      setErrorMessage("Hmm, my connection to the cloud is down.");
      setCompanionMessage("I can't connect right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepChange = (index, newValue) => {
    setSteps((prevSteps) =>
      prevSteps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, description: newValue } : step
      )
    );
  };

  const handleRemoveStep = (index) => {
    const updatedSteps = steps
      .filter((_, stepIndex) => stepIndex !== index)
      .map((step, stepIndex) => ({
        ...step,
        step_number: stepIndex + 1,
      }));

    setSteps(updatedSteps);
  };

  const handleAddStep = () => {
    setSteps((prevSteps) => [
      ...prevSteps,
      { step_number: prevSteps.length + 1, description: "" },
    ]);
  };

  const handleSaveAndClose = () => {
    const finalSteps = steps.filter((step) => String(step.description || "").trim() !== "");
    onSaveSteps(finalSteps);
    onClose();
  };

  return (
    <div
      className="task-assistant-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-assistant-title"
    >
      <button
        type="button"
        className="task-assistant-modal__backdrop"
        onClick={onClose}
        aria-label="Close task assistant"
      />

      <Card className="task-assistant-modal__panel" variant="glow">
        <button
          type="button"
          className="task-assistant-modal__close"
          onClick={onClose}
          aria-label="Close task assistant"
        >
          &times;
        </button>

        <div className="task-assistant-modal__intro">
          <div className="task-assistant-modal__mascot" style={{ opacity: isLoading ? 0.7 : 1 }}>
            {isParent ? (
              <div className="task-assistant-modal__emoji-guide" aria-hidden="true">
                {"\u{1F9ED}"}
              </div>
            ) : (
              <img src="/nova-robot.png" alt="Nova the Robot" />
            )}
          </div>
          <div className="task-assistant-modal__bubble">
            <p id="task-assistant-title" className="task-assistant-modal__message">
              {companionMessage}
            </p>
          </div>
        </div>

        {!steps.length ? (
          <div className="task-assistant-modal__actions">
            <Button onClick={handleGenerateSteps} disabled={isLoading} size="lg">
              {isLoading
                ? "Thinking..."
                : isParent
                  ? "Generate AI Steps"
                  : "Yes, please help me!"}
            </Button>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="task-assistant-modal__error" role="status">
            {errorMessage}
          </div>
        ) : null}

        {steps.length > 0 ? (
          <div className="task-assistant-modal__plan">
            <div className="task-assistant-modal__step-list">
              {steps.map((step, index) => (
                <div key={index} className="task-assistant-modal__step-item">
                  <div className="task-assistant-modal__step-number" aria-hidden="true">
                    {step.step_number}
                  </div>

                  {isParent ? (
                    <>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(event) => handleStepChange(index, event.target.value)}
                        className="task-assistant-modal__step-input"
                        aria-label={`Edit step ${step.step_number}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="task-assistant-modal__step-remove"
                        aria-label={`Remove step ${step.step_number}`}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span>{step.description}</span>
                  )}
                </div>
              ))}
            </div>

            {isParent ? (
              <div className="task-assistant-modal__add-row">
                <Button variant="secondary" onClick={handleAddStep}>
                  Add Manual Step
                </Button>
              </div>
            ) : null}

            <div className="task-assistant-modal__save-row">
              <Button onClick={handleSaveAndClose}>
                {isParent ? "Approve And Save Task" : "Accept Mission!"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default TaskAssistantModal;
