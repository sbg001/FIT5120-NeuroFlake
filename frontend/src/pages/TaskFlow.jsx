import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import BuddyIcon from "../components/ui/BuddyIcon";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import OpenMojiIcon from "../components/ui/OpenMojiIcon";
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

const soundMap = {
  rain: "/rain.mp3",
  "white-noise": "/white-noise.mp3",
  forest: "/forest.mp3",
};

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
  const [petPreference, setPetPreference] = useState("dog");
  const [loadError, setLoadError] = useState("");
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState("rain");
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const audioRef = useRef(null);

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

      setPetPreference(prefData?.character_style || "dog");
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
      setIsFocusActive(false);
      setIsRunning(false);
      setSecondsLeft(25 * 60);
      setIsSoundPlaying(false);
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

  useEffect(() => {
    setSecondsLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = true;
    audioRef.current.src = soundMap[selectedSound];
  }, [selectedSound]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isSoundPlaying) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {
        setIsSoundPlaying(false);
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isSoundPlaying, selectedSound]);

  const currentStep = steps[currentStepIndex];
  const progressValue = currentStepDone ? currentStepIndex + 1 : currentStepIndex;
  const isLastStep = currentStepIndex === steps.length - 1;
  const modeIcon = isFocusActive ? "target" : "compass";
  const emotionMeta = {
    happy: {
      icon: "grinning",
      text: "I love that energy. Let's tackle these steps together.",
    },
    tired: {
      icon: "sleeping",
      text: "We can go slowly and keep this light.",
    },
    overwhelmed: {
      icon: "worried",
      text: "It's okay to feel big things. We will take this gently.",
    },
  };

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

  const handleStartFocus = () => {
    setIsFocusActive(true);
    setIsRunning(false);
    setSupportMessage("");
  };

  const handleUseNormalFlow = () => {
    setIsFocusActive(false);
    setIsRunning(false);
    setIsSoundPlaying(false);
  };

  const handlePauseFocus = () => {
    setIsRunning(false);
  };

  const handleContinueFocus = () => {
    setIsRunning(true);
  };

  const handleDurationChange = (event) => {
    setDurationMinutes(Number(event.target.value));
    setIsRunning(false);
  };

  const handleResetFocusTimer = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const handleToggleSound = async () => {
    if (!audioRef.current) return;

    if (isSoundPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSoundPlaying(false);
      return;
    }

    audioRef.current.src = soundMap[selectedSound];
    audioRef.current.loop = true;

    try {
      await audioRef.current.play();
      setIsSoundPlaying(true);
    } catch {
      setIsSoundPlaying(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
        ? "That was the final step. When you are ready, finish the quest to see your reward."
        : "Nice and steady. You can pause here or move on when it feels right.",
    });
    setSupportMessage(
      isLastStep
        ? "You finished the last step. One more tap will wrap up the quest."
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
          "This quest has too many saved steps. Please ask a parent to reset this task before starting again."
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
      setSaveStepsMessage("Nova's steps are ready. Your quest can begin now.");

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
              eyebrow="Quest Setup"
              title={task.title}
              description="This quest needs 2 to 5 simple steps before it can begin."
            />

            {loadError ? <p className="page-text">{loadError}</p> : null}

            {saveStepsMessage ? <p className="page-text">{saveStepsMessage}</p> : null}

            <div className="focus-setup-actions">
              <Button onClick={() => setIsNovaOpen(true)}>
                I need help with this
              </Button>
            </div>
          </Card>
        </section>

        <TaskAssistantModal
          isOpen={isNovaOpen}
          onClose={() => setIsNovaOpen(false)}
          task={task}
          onSaveSteps={handleStepsSaved}
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
        <div className="focus-experience__mission-summary">
          <PageHeader
            eyebrow="Quest Flow"
            title={task.title}
            description={`Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`}
          />
          <ProgressBar
            value={progressValue}
            max={steps.length}
            label="Quest progress"
            className="task-progress"
          />
        </div>
        <div className="mission-flow-mode" aria-label="Choose quest mode">
          <div className="mission-flow-mode__icon" aria-hidden="true">
            <OpenMojiIcon name={modeIcon} />
          </div>
          <div className="mission-flow-mode__copy">
            <p className="eyebrow task-flow__eyebrow-icon">
              <span className="task-flow__tiny-openmoji" aria-hidden="true">
                <OpenMojiIcon name="brain" />
              </span>
              Choose your way
            </p>
            <p>
              {isFocusActive
                ? "Focus is on. One step at a time."
                : "Normal steps or Focus help."}
            </p>
          </div>
          <div className="mission-flow-mode__actions">
            <Button
              type="button"
              variant={isFocusActive ? "secondary" : "primary"}
              onClick={handleUseNormalFlow}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="compass" />
              </span>
              <span>Normal Steps</span>
            </Button>
            <Button
              type="button"
              variant={isFocusActive ? "primary" : "secondary"}
              onClick={handleStartFocus}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="target" />
              </span>
              <span>Focus</span>
            </Button>
          </div>
        </div>
      </Card>

      {currentStep ? (
        <Card className="hero-card focus-step-card" variant="glow">
          <div className="focus-step-card__meta">
            <span className="focus-step-card__eyebrow">
              <span className="task-flow__tiny-openmoji" aria-hidden="true">
                <OpenMojiIcon name={isFocusActive ? "target" : "seedling"} />
              </span>
              {isFocusActive ? "Focus Session" : "One Step At A Time"}
            </span>
            <div className="focus-step-card__status-row">
              {stepCelebration ? (
                <Badge tone="warm" className="task-flow__badge-icon">
                  <span className="task-flow__badge-openmoji" aria-hidden="true">
                    <OpenMojiIcon name="star" />
                  </span>
                  <span>Gentle celebration</span>
                </Badge>
              ) : null}
              {currentStepDone ? (
                <span className="focus-step-card__status task-flow__status-icon">
                  <span className="task-flow__badge-openmoji" aria-hidden="true">
                    <OpenMojiIcon name="check" />
                  </span>
                  <span>Step done</span>
                </span>
              ) : null}
            </div>
          </div>

          {isFocusActive ? (
            <div className="focus-timer-panel task-flow-focus-panel">
              <div className="focus-timer-panel__readout">
                <p className="focus-timer-panel__label task-flow__eyebrow-icon">
                  <span className="task-flow__tiny-openmoji" aria-hidden="true">
                    <OpenMojiIcon name="hourglass" />
                  </span>
                  Calm timer
                </p>
                <strong className="focus-timer-panel__time">{formatTime(secondsLeft)}</strong>
                <span>{isRunning ? "Timer is running" : "Timer is ready"}</span>
              </div>

              <div className="focus-timer-panel__controls">
                <Button
                  variant={isRunning ? "secondary" : "primary"}
                  onClick={isRunning ? handlePauseFocus : handleContinueFocus}
                >
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name={isRunning ? "herb" : "hourglass"} />
                  </span>
                  <span>{isRunning ? "Pause" : "Start Timer"}</span>
                </Button>
                <select
                  aria-label="Timer length"
                  value={durationMinutes}
                  onChange={handleDurationChange}
                >
                  <option value="10">10 min</option>
                  <option value="15">15 min</option>
                  <option value="25">25 min</option>
                  <option value="35">35 min</option>
                </select>
                <Button variant="secondary" onClick={handleResetFocusTimer}>
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name="sparkles" />
                  </span>
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          ) : null}

          {emotion ? (
            <div className="focus-step-card__emotion-note">
              <span className="task-flow__note-openmoji" aria-hidden="true">
                <OpenMojiIcon name={emotionMeta[emotion]?.icon || "speech"} />
              </span>
              <span>{emotionMeta[emotion]?.text}</span>
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
                <span className="task-flow__note-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="lightbulb" />
                </span>
                <span>Try this: {currentStep.example_text}</span>
              </div>
            ) : null}

            {stepCelebration ? (
              <div className="focus-step-card__celebration" role="status" aria-live="polite">
                <div className="focus-step-card__celebration-stars" aria-hidden="true">
                  <span><OpenMojiIcon name="star" /></span>
                  <span><OpenMojiIcon name="sparkles" /></span>
                  <span><OpenMojiIcon name="star" /></span>
                </div>
                <div className="focus-step-card__celebration-copy">
                  <strong>{stepCelebration.title}</strong>
                  <p>{stepCelebration.detail}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="focus-step-card__actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSupportPanel(true);
                setSupportMessage("Pick one helper below.");
              }}
              disabled={showSupportPanel}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="herb" />
              </span>
              <span>{showSupportPanel ? "Help is open" : "Help Me"}</span>
            </Button>
            <Button onClick={handleDone}>
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name={currentStepDone ? (isLastStep ? "gift" : "compass") : "check"} />
              </span>
              <span>
              {String(task.status) === "completed"
                ? "View Rewards"
                : currentStepDone
                  ? isLastStep
                    ? "Finish Quest"
                    : "Next Step"
                  : "Done"}
              </span>
            </Button>
          </div>

          {showSupportPanel ? (
            <div className="focus-support-panel">
              <div className="focus-support-panel__header">
                <p className="focus-support-panel__title task-flow__eyebrow-icon">
                  <span className="task-flow__tiny-openmoji" aria-hidden="true">
                    <OpenMojiIcon name="seedling" />
                  </span>
                  Choose a small helper.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowSupportPanel(false);
                    setSupportMessage("");
                    setIsSoundPlaying(false);
                  }}
                >
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name="check" />
                  </span>
                  <span>I'm okay now</span>
                </Button>
              </div>
              <p className="focus-support-panel__hint">
                You can breathe, pause, or play a calm sound.
              </p>
              <div className="focus-support-panel__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSupportMessage("Take one slow breath in... and one slow breath out.")
                  }
                >
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name="herb" />
                  </span>
                  <span>Take a breath</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsRunning(false);
                    setSupportMessage(
                      "Take a small break, then come back when your body feels ready."
                    );
                  }}
                >
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name="sleeping" />
                  </span>
                  <span>Small break</span>
                </Button>
              </div>
              <div className="focus-support-panel__audio">
                <select
                  aria-label="Calm sound"
                  value={selectedSound}
                  onChange={(e) => setSelectedSound(e.target.value)}
                >
                  <option value="rain">Rain</option>
                  <option value="white-noise">White noise</option>
                  <option value="forest">Forest</option>
                </select>
                <Button variant="secondary" size="sm" onClick={handleToggleSound}>
                  <span className="task-flow__button-icon" aria-hidden="true">
                    <OpenMojiIcon name="music" />
                  </span>
                  <span>{isSoundPlaying ? "Stop Sound" : "Calm Sound"}</span>
                </Button>
              </div>
              {supportMessage ? (
                <p className="focus-support-panel__message">{supportMessage}</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {!emotion ? (
        <Card className="content-card focus-emotion-card" variant="glow">
          <div className="focus-emotion-card__pet" aria-hidden="true">
            <BuddyIcon type={petPreference} label="Buddy" decorative />
          </div>
          <div className="focus-emotion-card__copy">
            <p className="eyebrow task-flow__eyebrow-icon">
              <span className="task-flow__tiny-openmoji" aria-hidden="true">
                <OpenMojiIcon name="speech" />
              </span>
              Check In
            </p>
            <h3>How do you feel?</h3>
            <p className="page-text">Pick one feeling.</p>
          </div>
          <div className="focus-emotion-card__actions">
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("happy")}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="grinning" />
              </span>
              <span>Good</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("tired")}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="sleeping" />
              </span>
              <span>Tired</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEmotionCheckIn("overwhelmed")}
            >
              <span className="task-flow__button-icon" aria-hidden="true">
                <OpenMojiIcon name="worried" />
              </span>
              <span>Too much</span>
            </Button>
          </div>
        </Card>
      ) : null}

      <TaskAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        task={task}
        onSaveSteps={handleStepsSaved}
      />
      <audio ref={audioRef} hidden />
    </section>
  );
}

export default TaskFlow;
