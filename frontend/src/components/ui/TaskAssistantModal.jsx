import { useEffect, useState } from "react";
import Button from "./Button";
import Card from "./Card";
import { requestTaskBreakdown } from "../../services";

function TaskAssistantModal({ isOpen, onClose, task, onSaveSteps }) {
  const [steps, setSteps] = useState([]);
  const [companionMessage, setCompanionMessage] = useState(
    "Hi there! I'm Nova. What are we working on today?"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setCompanionMessage(
        `Hi! I see we need to work on ${task.title}. Should I help you break this down into easy steps?`
      );
      setSteps([]);
      setErrorMessage("");
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleGenerateSteps = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setCompanionMessage("Scanning my data banks for the best mission plan...");

    try {
      const data = await requestTaskBreakdown(task.title);

      if (data && Array.isArray(data.steps)) {
        setSteps(data.steps);
        setCompanionMessage(data.companion_message || "Here is our mission plan!");
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

  const handleSaveAndClose = () => {
    onSaveSteps(steps);
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
          ×
        </button>

        <div className="task-assistant-modal__intro">
          <div
            className="task-assistant-modal__mascot"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <img src="/nova-robot.png" alt="Nova the Robot" />
          </div>
          <div className="task-assistant-modal__bubble">
            <p id="task-assistant-title" className="task-assistant-modal__message">
              {companionMessage}
            </p>
          </div>
        </div>

        {!steps.length && (
          <div className="task-assistant-modal__actions">
            <Button onClick={handleGenerateSteps} disabled={isLoading} size="lg">
              {isLoading ? "Thinking..." : "Yes, please help me!"}
            </Button>
          </div>
        )}

        {errorMessage ? (
          <div className="task-assistant-modal__error" role="status">
            {errorMessage}
          </div>
        ) : null}

        {steps.length > 0 ? (
          <div className="task-assistant-modal__plan">
            <div className="task-assistant-modal__step-list">
              {steps.map((step) => (
                <div key={step.step_number} className="task-assistant-modal__step-item">
                  <div className="task-assistant-modal__step-number" aria-hidden="true">
                    {step.step_number}
                  </div>
                  <span>{step.description}</span>
                </div>
              ))}
            </div>

            <div className="task-assistant-modal__save-row">
              <Button onClick={handleSaveAndClose}>Accept Mission!</Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default TaskAssistantModal;
