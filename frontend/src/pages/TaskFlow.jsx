import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import TaskAssistantModal from "../components/ui/TaskAssistantModal";
import {
  completeStep,
  completeTask,
  createRewardTransaction,
  createTaskStep,
  getChildPreferences,
  getPointsBalance,
  getTaskById,
  getTaskSteps,
  saveEmotionSelection,
  updatePointsBalance,
  updateTaskStepCount,
} from "../services";

function TaskFlow() {
  const celebrationMessages = [
    "Great effort!",
    "You completed a step!",
    "Your focus is growing!",
  ];

  const [task, setTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taskReady, setTaskReady] = useState(true);
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [currentStepDone, setCurrentStepDone] = useState(false);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [stepCelebration, setStepCelebration] = useState(null);
  const [saveStepsMessage, setSaveStepsMessage] = useState("");
  const [emotion, setEmotion] = useState(null);
  const [petPreference, setPetPreference] = useState("\u{1F9F8}");
  const [loadError, setLoadError] = useState("");

  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTask() {
      setLoading(true);
      setLoadError("");

      const [taskResult, stepsResult, preferenceResult] = await Promise.all([
        getTaskById(taskId),
        getTaskSteps(taskId),
        getChildPreferences(),
      ]);
      const taskData = taskResult.data;
      const stepsData = stepsResult.data;
      const prefData = preferenceResult.data;

      const orderedSteps = stepsData || [];
      const validStepCount = orderedSteps.length >= 2 && orderedSteps.length <= 5;
      const firstIncompleteIndex = orderedSteps.findIndex((step) => step.is_completed === false);
      const nextIndex =
        firstIncompleteIndex === -1 && orderedSteps.length > 0
          ? orderedSteps.length - 1
          : firstIncompleteIndex !== -1
            ? firstIncompleteIndex
            : 0;

      const characterMap = {
        star: "\u2B50",
        rocket: "\u{1F680}",
        bear: "\u{1F9F8}",
        cat: "\u{1F431}",
        dog: "\u{1F436}",
        fox: "\u{1F98A}",
      };

      setPetPreference(characterMap[prefData?.character_style] || "\u{1F9F8}");
      setTask(taskData);
      setSteps(orderedSteps);
      setTaskReady(validStepCount);
      setCurrentStepIndex(nextIndex);
      setCurrentStepDone(Boolean(orderedSteps[nextIndex]?.is_completed));
      setShowSupportPanel(false);
      setSupportMessage("");
      setStepCelebration(null);
      setSaveStepsMessage("");
      setEmotion(localStorage.getItem(`emotion_checkin_${taskId}_${new Date().toISOString().slice(0, 10)}`));
      setLoadError(
        taskResult.error || stepsResult.error || preferenceResult.error || ""
      );
      setLoading(false);

      if (orderedSteps.length < 1) {
        setIsNovaOpen(true);
      }
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const currentStep = steps[currentStepIndex];
  const progressValue = currentStepDone ? currentStepIndex + 1 : currentStepIndex;
  const isLastStep = currentStepIndex === steps.length - 1;

  const triggerCompanionEmotion = (state) => {
    window.dispatchEvent(new CustomEvent("companionEmotion", { detail: state }));
  };

  const getTodayEmotionCheckInKey = () => {
    const today = new Date().toISOString().slice(0, 10);
    return `emotion_checkin_${taskId}_${today}`;
  };

  const handleEmotionCheckIn = async (emotionType) => {
    setEmotion(emotionType);
    localStorage.setItem(getTodayEmotionCheckInKey(), emotionType);

    if (emotionType === "happy") {
      triggerCompanionEmotion("success");
    }

    if (emotionType === "overwhelmed") {
      triggerCompanionEmotion("struggle");
    }

    if (!task?.child_id) {
      return;
    }

    await saveEmotionSelection({
      child_id: task.child_id,
      emotion_type: emotionType,
      linked_task_id: task.task_id,
      notes: null,
    });
  };
  const goToNextStep = () => {
    if (isLastStep) return;

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setCurrentStepDone(Boolean(steps[nextIndex]?.is_completed));
    setShowSupportPanel(false);
    setSupportMessage("");
    setStepCelebration(null);
  };

  const handleFinishTask = async () => {
    if (!task || String(task.status) === "completed") {
      navigate("/rewards", { state: { showCelebration: false } });
      return;
    }

    const alreadyRewardedKey = `rewarded_task_${task.task_id}`;

    if (localStorage.getItem(alreadyRewardedKey)) {
      navigate("/rewards", { state: { showCelebration: false } });
      return;
    }

    await completeTask(taskId);

    const pointsResult = await getPointsBalance(task.child_id);
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

    localStorage.setItem(alreadyRewardedKey, "true");

    setTask((prevTask) =>
      prevTask ? { ...prevTask, status: "completed" } : prevTask
    );

    navigate("/rewards", { state: { showCelebration: true } });
  };

  const handleDone = async () => {
    if (String(task?.status) === "completed") {

      navigate("/rewards", { state: { showCelebration: false } });

      return;

    }
    if (!currentStep) return;

    if (currentStepDone) {
      if (isLastStep) {
        await handleFinishTask();
      } else {
        goToNextStep();
      }
      return;
    }

    const completeStepResult = await completeStep(taskId, currentStep.step_id);
    if (completeStepResult.error) {
      setSupportMessage("This step could not be marked done yet. Please try again.");
      return;
    }
    triggerCompanionEmotion("success");

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

    setCurrentStepDone(true);
    setStepCelebration({
      title: celebrationMessages[currentStepIndex % celebrationMessages.length],
      detail: isLastStep
        ? "That was the final step. When you are ready, finish the mission to see your reward."
        : "Nice and steady. You can pause here or move on when it feels right.",
    });
    setSupportMessage(
      isLastStep
        ? "You finished the last step. One more tap will wrap up the mission."
        : "Nice work. This step is done."
    );
  };

  const handleStepsSaved = async (generatedSteps) => {
    try {
      const existingStepsResult = await getTaskSteps(taskId);
      const existingSteps = existingStepsResult.data || [];

      if (existingSteps.length >= 2 && existingSteps.length <= 5) {
        const { data: taskData, error: taskError } = await getTaskById(taskId);
        const firstIncompleteIndex = existingSteps.findIndex((step) => !step.is_completed);
        const nextIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;

        setTask(taskData);
        setSteps(existingSteps);
        setTaskReady(true);
        setCurrentStepIndex(nextIndex);
        setCurrentStepDone(Boolean(existingSteps[nextIndex]?.is_completed));
        setIsNovaOpen(false);
        setSaveStepsMessage("");
        setLoadError(taskError || existingStepsResult.error || "");
        return;
      }

      if (existingSteps.length > 5) {
        setIsNovaOpen(false);
        setTaskReady(false);
        setSaveStepsMessage(
          "This mission has too many saved steps. Please ask a parent to reset this task before starting again."
        );
        return;
      }

      for (const [index, step] of generatedSteps.entries()) {
        await createTaskStep({
          task_id: taskId,
          step_title: step.step_title || step.description || `Step ${index + 1}`,
          step_description:
            step.step_description ||
            step.description ||
            step.step_title ||
            "",
          step_order: step.step_number || index + 1,
          visual_hint: step.visual_hint || "",
          example_text: step.example_text || "",
        });
      }

      await updateTaskStepCount(taskId);
      setSaveStepsMessage("Nova's steps are ready. Your mission can begin now.");

      const [taskResult, stepsResult] = await Promise.all([
        getTaskById(taskId),
        getTaskSteps(taskId),
      ]);

      const taskData = taskResult.data;
      const orderedSteps = stepsResult.data || [];
      const firstIncompleteIndex = orderedSteps.findIndex((step) => !step.is_completed);
      const nextIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;

      setTask(taskData);
      setSteps(orderedSteps);
      setTaskReady(orderedSteps.length >= 2 && orderedSteps.length <= 5);
      setCurrentStepIndex(nextIndex);
      setCurrentStepDone(Boolean(orderedSteps[nextIndex]?.is_completed));
      setIsNovaOpen(false);
      setLoadError(taskResult.error || stepsResult.error || "");
    } catch {
      setSaveStepsMessage("The task was saved, but the new steps could not be loaded yet.");
    }
  };

  if (!taskId) return <p className="page-text">No task selected</p>;
  if (loading) return <p className="page-text">Loading task...</p>;
  if (!task) return <p className="page-text">No task available</p>;

  if (!taskReady) {
    return (
      <div>
        <section className="page-section">
          <Card className="content-card" variant="soft">
            <PageHeader
              eyebrow="Mission Setup"
              title={task.title}
              description="This mission needs 2 to 5 simple steps before it can begin."
            />

            {loadError ? <p className="page-text">{loadError}</p> : null}

            {saveStepsMessage ? <p className="page-text">{saveStepsMessage}</p> : null}

            <div className="focus-setup-actions">
              <Button onClick={() => setIsNovaOpen(true)}>
                {petPreference} I need help with this
              </Button>
            </div>
          </Card>
        </section>

        <TaskAssistantModal
          isOpen={isNovaOpen}
          onClose={() => setIsNovaOpen(false)}
          task={task}
          onSaveSteps={handleStepsSaved}
          petPreference={petPreference}
        />
      </div>
    );
  }

  return (
    <section className="page-section focus-experience">
      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}
      <Card className="content-card focus-experience__top-card" variant="soft">
        <PageHeader
          eyebrow="Mission Flow"
          title={task.title}
          description={`Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`}
        />
        <ProgressBar
          value={progressValue}
          max={steps.length}
          label="Mission progress"
          className="task-progress"
        />
      </Card>

      {!emotion ? (
        <Card className="content-card focus-emotion-card" variant="glow">
          <div className="focus-emotion-card__pet" aria-hidden="true">
            {petPreference}
          </div>
          <div className="focus-emotion-card__copy">
            <p className="eyebrow">Check In</p>
            <h3>How are you feeling right now?</h3>
            <p className="page-text">
              We can change the tone of this mission before we begin.
            </p>
          </div>
          <div className="focus-emotion-card__actions">
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("happy")}
            >
              Good / Happy
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("tired")}
            >
              Tired
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("overwhelmed")}
            >
              Overwhelmed
            </Button>
          </div>
        </Card>
      ) : null}

      {currentStep ? (
        <Card className="hero-card focus-step-card" variant="glow">
          <div className="focus-step-card__meta">
            <span className="focus-step-card__eyebrow">One Step At A Time</span>
            <div className="focus-step-card__status-row">
              {stepCelebration ? <Badge tone="warm">Gentle celebration</Badge> : null}
              {currentStepDone ? (
                <span className="focus-step-card__status">Step done</span>
              ) : null}
            </div>
          </div>

          {emotion ? (
            <div className="focus-step-card__emotion-note">
              {emotion === "happy" && "I love that energy. Let's tackle these steps together."}
              {emotion === "tired" && "We can go slowly and keep this light."}
              {emotion === "overwhelmed" && "It's okay to feel big things. We will take this gently."}
            </div>
          ) : null}

          <div className="focus-step-card__body">
            {currentStep.visual_hint ? (
              <div className="focus-step-card__visual" aria-hidden="true">
                {currentStep.visual_hint}
              </div>
            ) : null}

            <h3 className="focus-step-card__title">
              {currentStep.step_description || currentStep.step_title}
            </h3>

            {currentStep.step_description &&
            currentStep.step_description !== currentStep.step_title ? (
              <p className="focus-step-card__support-text">{currentStep.step_title}</p>
            ) : null}

            {currentStep.example_text ? (
              <div className="focus-step-card__example">
                Try this: {currentStep.example_text}
              </div>
            ) : null}

            {stepCelebration ? (
              <div className="focus-step-card__celebration" role="status" aria-live="polite">
                <div className="focus-step-card__celebration-stars" aria-hidden="true">
                  <span>{"\u2B50"}</span>
                  <span>{"\u2728"}</span>
                  <span>{"\u2B50"}</span>
                </div>
                <div className="focus-step-card__celebration-copy">
                  <strong>{stepCelebration.title}</strong>
                  <p>{stepCelebration.detail}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="focus-step-card__actions">
            <Button variant="secondary" onClick={() => setShowSupportPanel((prev) => !prev)}>
              I need a break
            </Button>
            <Button onClick={handleDone}>
              {String(task.status) === "completed"
                ? "View Rewards"
                : currentStepDone
                  ? isLastStep
                    ? "Finish Mission"
                    : "Next Step"
                  : "Done"}
            </Button>
          </div>

          {showSupportPanel ? (
            <div className="focus-support-panel">
              <p className="focus-support-panel__title">Let's make this feel smaller.</p>
              <div className="focus-support-panel__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSupportMessage("Take one slow breath in... and one slow breath out.")
                  }
                >
                  Take a breath
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSupportMessage(
                      "Take a small break, then come back when your body feels ready."
                    )
                  }
                >
                  Small break
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    triggerCompanionEmotion("struggle");
                    setSupportMessage(
                      "That is okay. We can try the same step again, nice and gently."
                    );
                  }}
                >
                  Try again
                </Button>
              </div>
              {supportMessage ? (
                <p className="focus-support-panel__message">{supportMessage}</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      <TaskAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        task={task}
        onSaveSteps={handleStepsSaved}
        petPreference={petPreference}
      />
    </section>
  );
}

export default TaskFlow;
