import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import {
  getTasks,
  getTaskSteps,
  getChildProfile,
  completeStep,
  completeTaskWithReward,
} from "../services";

const soundMap = {
  rain: "/rain.mp3",
  "white-noise": "/white-noise.mp3",
  forest: "/forest.mp3",
};

function FocusMode() {
  const navigate = useNavigate();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [currentTask, setCurrentTask] = useState(null);
  const [taskSteps, setTaskSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [currentStepDone, setCurrentStepDone] = useState(false);
  const [focusMessage, setFocusMessage] = useState("");
  const [showSupportPanel, setShowSupportPanel] = useState(false);

  const [selectedSound, setSelectedSound] = useState("rain");
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    async function loadFocusData() {
      setLoading(true);
      setLoadError("");

      const childResult = await getChildProfile();
      const childData = childResult.data;

      if (!childData?.user_id) {
        setAvailableTasks([]);
        setLoadError(
          childResult.error || "We could not load focus mode right now."
        );
        setLoading(false);
        return;
      }

      const tasksResult = await getTasks(childData.user_id);
      const allTasks = tasksResult.data || [];

      const activeTasks = allTasks
        .filter((task) => task.status !== "completed")
        .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

      const tasksWithValidSteps = [];

      for (const task of activeTasks) {
        const stepsResult = await getTaskSteps(task.task_id);
        const steps = stepsResult.data || [];

        if (steps.length >= 2 && steps.length <= 5) {
          tasksWithValidSteps.push(task);
        }
      }

      setAvailableTasks(tasksWithValidSteps);
      setLoadError(childResult.error || tasksResult.error || "");
      setLoading(false);
          }

    loadFocusData();
  }, []);

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

  const handleTaskChange = async (taskId) => {
    setSelectedTaskId(taskId);
    setCurrentTask(null);
    setCurrentStep(null);
    setTaskSteps([]);
    setCurrentStepIndex(0);
    setFocusMessage("");
    setIsRunning(false);
    setIsFocusActive(false);
    setCurrentStepDone(false);
    setShowSupportPanel(false);

    if (!taskId) return;

    const selectedTask =
      availableTasks.find((task) => String(task.task_id) === String(taskId)) || null;
    setCurrentTask(selectedTask);

    const stepsResult = await getTaskSteps(taskId);
    const steps = stepsResult.data || [];
    if (stepsResult.error) {
      setLoadError(stepsResult.error);
    }
    setTaskSteps(steps);

    const firstIncompleteIndex = steps.findIndex((step) => !step.is_completed);
    const nextIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;

    setCurrentStepIndex(nextIndex);
    setCurrentStep(steps[nextIndex] || null);
    setCurrentStepDone(Boolean(steps[nextIndex]?.is_completed));
  };

  const handleMarkStepComplete = async () => {
    if (!selectedTaskId || !currentStep) return;

    const result = await completeStep(selectedTaskId, currentStep.step_id);

    if (result.error) {
      setFocusMessage("This step could not be marked done yet. Please try again.");
      return;
    }

    setTaskSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.step_id === currentStep.step_id
          ? { ...step, is_completed: true, completed_at: new Date().toISOString() }
          : step
      )
    );
    setCurrentStep((prevStep) =>
      prevStep
        ? { ...prevStep, is_completed: true, completed_at: new Date().toISOString() }
        : prevStep
    );
    setCurrentStepDone(true);
    setFocusMessage("Nice work. This step is done.");
  };

  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= taskSteps.length) return;

    setCurrentStepIndex(nextIndex);
    setCurrentStep(taskSteps[nextIndex]);
    setCurrentStepDone(Boolean(taskSteps[nextIndex]?.is_completed));
    setFocusMessage("");
    setShowSupportPanel(false);
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskId || !currentTask?.child_id || !currentTask?.task_id) {
      setFocusMessage("This mission is missing task details. Please try again.");
      return;
    }

    if (String(currentTask.status) === "completed") {
      navigate("/rewards", { state: { showCelebration: false } });
      return;
    }

    const alreadyRewardedKey = `rewarded_task_${currentTask.task_id}`;

    if (localStorage.getItem(alreadyRewardedKey)) {
      navigate("/rewards", { state: { showCelebration: false } });
      return;
    }

    const completedStepCount = Math.max(taskSteps.length, 1);
    const earnedPoints = completedStepCount * 10;
    const completeResult = await completeTaskWithReward({
      child_id: currentTask.child_id,
      task_id: currentTask.task_id,
      points_earned: earnedPoints,
      steps_completed: completedStepCount,
    });

    if (completeResult.error) {
      setFocusMessage("The mission could not be completed yet. Please try again.");
      return;
    }

    const updatedPoints = completeResult.data?.points?.points_balance ?? 0;

    localStorage.setItem(alreadyRewardedKey, "true");
    setAvailableTasks((prevTasks) =>
      prevTasks.filter((task) => String(task.task_id) !== String(currentTask.task_id))
    );
    setCurrentStep(null);

    setCurrentStep(null);
    setFocusMessage("Mission complete. You did it.");
    setIsFocusActive(false);
    setIsRunning(false);
    setCurrentStepDone(false);
    setShowSupportPanel(false);
    navigate("/rewards", {
      state: {
        showCelebration: true,
        pointsEarned: earnedPoints,
        updatedPointsBalance: updatedPoints,
        taskTitle: currentTask.title,
      },
    });
  };

  const handleStartFocus = () => {
    if (!currentTask || !currentStep) return;
    setIsFocusActive(true);
    setIsRunning(false);
    setFocusMessage("");
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

  const handleDoneAction = async () => {
    if (!currentStep) return;

    if (currentStepDone) {
      if (currentStepIndex >= taskSteps.length - 1) {
        await handleCompleteTask();
      } else {
        handleNextStep();
      }
      return;
    }

    await handleMarkStepComplete();
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const handleToggleSound = async () => {
    if (!audioRef.current) return;

    if (isSoundPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSoundPlaying(false);
    } else {
      audioRef.current.src = soundMap[selectedSound];
      audioRef.current.loop = true;
      try {
        await audioRef.current.play();
        setIsSoundPlaying(true);
      } catch {
        setIsSoundPlaying(false);
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progressValue = currentStepDone ? currentStepIndex + 1 : currentStepIndex;
  const isLastStep = currentStepIndex >= taskSteps.length - 1;

  if (loading) {
    return (
      <section className="page-section">
        <p className="page-text">Loading focus mode...</p>
      </section>
    );
  }

  return (
    <section className="page-section focus-experience">
      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}
      {!isFocusActive && (
        <Card className="content-card focus-experience__top-card" variant="soft">
          <PageHeader
            eyebrow="Focus Mode"
            title="A calm space for one step at a time"
            description="Pick a mission first. The timer starts only when you press Start Timer."
          />

          <div className="focus-setup-grid">
            <div className="focus-setup-grid__field">
              <label htmlFor="focus-task-select" className="focus-setup-grid__label">
                Choose a mission
              </label>
              <select
                id="focus-task-select"
                value={selectedTaskId}
                onChange={(e) => handleTaskChange(e.target.value)}
              >
                <option value="">Select a task</option>
                {availableTasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="focus-timer-pill">
              <span className="focus-timer-pill__label">Timer</span>
              <strong>{formatTime(secondsLeft)}</strong>
            </div>
          </div>

          <div className="focus-setup-actions">
            <Button onClick={handleStartFocus} disabled={!currentTask || !currentStep}>
              Open Focus
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Card>
      )}

      {currentTask && currentStep ? (
        <Card className="hero-card focus-step-card" variant="glow">
          <div className="focus-step-card__meta">
            <span className="focus-step-card__eyebrow">
              {isFocusActive ? "Focus Session" : "Ready To Focus"}
            </span>
            <span className="focus-step-card__status">
              Step {Math.min(currentStepIndex + 1, taskSteps.length)} of {taskSteps.length}
            </span>
          </div>

          <ProgressBar
            value={progressValue}
            max={taskSteps.length}
            label="Focus mission progress"
            className="task-progress"
          />

          <div className="focus-step-card__body">
            {currentStep.visual_hint ? (
              <div className="focus-step-card__visual" aria-hidden="true">
                {currentStep.visual_hint}
              </div>
            ) : null}

            <h3 className="focus-step-card__title">
              {currentStep.step_description || currentStep.step_title}
            </h3>

            <p className="focus-step-card__support-text">Mission: {currentTask.title}</p>

            {currentStep.example_text ? (
              <div className="focus-step-card__example">
                Try this: {currentStep.example_text}
              </div>
            ) : null}
          </div>

          {isFocusActive && (
            <div className="focus-timer-panel">
              <div className="focus-timer-panel__readout">
                <p className="focus-timer-panel__label">Calm timer</p>
                <strong className="focus-timer-panel__time">{formatTime(secondsLeft)}</strong>
                <span>{isRunning ? "Timer is running" : "Timer is ready"}</span>
              </div>

              <div className="focus-timer-panel__controls">
                <Button
                  variant={isRunning ? "secondary" : "primary"}
                  onClick={isRunning ? handlePauseFocus : handleContinueFocus}
                >
                  {isRunning ? "Pause" : "Start Timer"}
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
                <Button variant="secondary" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          )}

          <div className="focus-step-card__actions">
            {isFocusActive ? (
              <Button
                variant="secondary"
                onClick={() => setShowSupportPanel((prev) => !prev)}
              >
                Help Me
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStartFocus}>
                Open Focus
              </Button>
            )}

            <Button onClick={handleDoneAction}>
              {currentStepDone
                ? isLastStep
                  ? "Finish Mission"
                  : "Next Step"
                : "Done"}
            </Button>
          </div>

          {showSupportPanel && (
            <div className="focus-support-panel">
              <p className="focus-support-panel__title">Let's calm this step down.</p>
              <div className="focus-support-panel__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setFocusMessage("Take a breath: in slowly... and out slowly.")
                  }
                >
                  Take a breath
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsRunning(false);
                    setFocusMessage("Take a small break. Come back when you feel ready.");
                  }}
                >
                  Small break
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
                  {isSoundPlaying ? "Stop Sound" : "Calm Sound"}
                </Button>
              </div>

              {focusMessage ? (
                <p className="focus-support-panel__message">{focusMessage}</p>
              ) : null}
            </div>
          )}
        </Card>
      ) : (
        <Card className="hero-card" variant="soft">
          <PageHeader
            eyebrow="No Mission Selected"
            title="Choose one mission to begin focus mode"
            description="Once you pick a mission, only one clear step will show at a time."
          />
        </Card>
      )}

      <audio ref={audioRef} hidden />
    </section>
  );
}

export default FocusMode;
