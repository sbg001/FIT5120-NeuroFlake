import { useEffect, useRef, useState } from "react";
import { getTasks, getTaskSteps, getChildProfile, completeStep, completeTask } from "../services";

function FocusMode() {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [currentTask, setCurrentTask] = useState(null);
  const [taskSteps, setTaskSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusMessage, setFocusMessage] = useState("");

  const [selectedSound, setSelectedSound] = useState("rain");
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const [supportMode, setSupportMode] = useState("calm");

  const audioRef = useRef(null);

  const soundMap = {
    rain: "/rain.mp3",
    "white-noise": "/white-noise.mp3",
    forest: "/forest.mp3",
  };

  useEffect(() => {
    async function loadFocusData() {
      setLoading(true);

      const childResult = await getChildProfile();
      const childData = childResult.data;

      const tasksResult = await getTasks();
      const allTasks = tasksResult.data || [];

      const childTasks = allTasks
        .filter((task) => task.child_id === childData?.user_id)
        .filter((task) => task.status !== "completed")
        .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

      setAvailableTasks(childTasks);
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

  useEffect(() => {
    if (supportMode === "calm") {
      setFocusMessage("");
      return;
    }

    if (supportMode === "support") {
      setIsRunning(false);
      setDurationMinutes((prev) => Math.max(prev, 30));
      setFocusMessage("Take your time. You can go one small step at a time.");
      return;
    }

    if (supportMode === "overwhelmed") {
      setIsRunning(false);
      setFocusMessage("It is okay to pause. Take a breath, listen to a calming sound, and return when ready.");
    }
  }, [supportMode]);

  const handleTaskChange = async (taskId) => {
    setSelectedTaskId(taskId);
    setCurrentTask(null);
    setCurrentStep(null);
    setTaskSteps([]);
    setCurrentStepIndex(0);
    setFocusMessage("");
    setIsRunning(false);

    if (!taskId) return;

    const selectedTask =
      availableTasks.find((task) => task.task_id === taskId) || null;
    setCurrentTask(selectedTask);

    const stepsResult = await getTaskSteps(taskId);
    const steps = stepsResult.data || [];
    setTaskSteps(steps);

    const firstIncompleteIndex = steps.findIndex((step) => !step.is_completed);
    const nextIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;

    setCurrentStepIndex(nextIndex);
    setCurrentStep(steps[nextIndex] || null);
  };

  const refreshSteps = async (taskId) => {
    const stepsResult = await getTaskSteps(taskId);
    const steps = stepsResult.data || [];
    setTaskSteps(steps);

    const firstIncompleteIndex = steps.findIndex((step) => !step.is_completed);

    if (firstIncompleteIndex === -1) {
      setCurrentStep(null);
      setFocusMessage("Task completed in focus mode.");
      return;
    }

    setCurrentStepIndex(firstIncompleteIndex);
    setCurrentStep(steps[firstIncompleteIndex]);
    setFocusMessage("");
  };

  const handleMarkStepComplete = async () => {
    if (!selectedTaskId || !currentStep) return;

    await completeStep(selectedTaskId, currentStep.step_id);
    await refreshSteps(selectedTaskId);
  };

  const handleNextStep = () => {
    if (!taskSteps.length) return;

    const nextIndex = currentStepIndex + 1;

    if (nextIndex < taskSteps.length) {
      setCurrentStepIndex(nextIndex);
      setCurrentStep(taskSteps[nextIndex]);
      setFocusMessage("");
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskId) return;

    await completeTask(selectedTaskId);
    setCurrentStep(null);
    setFocusMessage("Task completed in focus mode.");
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleGoSlower = () => {
    setDurationMinutes((prev) => prev + 5);
    setIsRunning(false);
  };

  const handleGoFaster = () => {
    setDurationMinutes((prev) => Math.max(5, prev - 5));
    setIsRunning(false);
  };

  const handleStartPause = () => {
    if (supportMode === "overwhelmed") return;
    setIsRunning((prev) => !prev);
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

  const progressPercent =
    taskSteps.length > 0 ? ((currentStepIndex + 1) / taskSteps.length) * 100 : 0;

  const supportCardStyle =
    supportMode === "overwhelmed"
      ? {
          backgroundColor: "#fff4f4",
          border: "1px solid #ffd6d6",
        }
      : supportMode === "support"
      ? {
          backgroundColor: "#f8faff",
          border: "1px solid #d8e4ff",
        }
      : {};

  if (loading) {
    return (
      <section className="page-section">
        <p className="page-text">Loading focus mode...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Focus Mode</p>
        <h2 className="page-title">A calm space to focus on one step at a time</h2>
        <p className="page-text">
          This screen is designed to reduce distractions and help the child stay
          calm, clear, and supported while completing the current step.
        </p>
      </div>

      <div className="content-card">
        <h3 style={{ marginBottom: "1rem" }}>Choose a task to focus on</h3>

        <select
          value={selectedTaskId}
          onChange={(e) => handleTaskChange(e.target.value)}
          style={{
            width: "100%",
            padding: "0.9rem 1rem",
            borderRadius: "16px",
            border: "1px solid #d8dbe8",
            fontSize: "1rem",
          }}
        >
          <option value="">Select a task</option>
          {availableTasks.map((task) => (
            <option key={task.task_id} value={task.task_id}>
              {task.title}
              {task.priority_type
                ? ` - ${task.priority_type} (${task.priority_rank})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="content-card">
        <h3 style={{ marginBottom: "1rem" }}>Support Mode</h3>
        <p className="page-text">
          Choose how you are feeling, and the focus space will adjust to support you.
        </p>

        <div className="button-row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            className={supportMode === "calm" ? "primary-button" : "secondary-button"}
            onClick={() => setSupportMode("calm")}
          >
            Feeling Calm
          </button>
          <button
            className={supportMode === "support" ? "primary-button" : "secondary-button"}
            onClick={() => setSupportMode("support")}
          >
            Need More Support
          </button>
          <button
            className={supportMode === "overwhelmed" ? "primary-button" : "secondary-button"}
            onClick={() => setSupportMode("overwhelmed")}
          >
            Feeling Overwhelmed
          </button>
        </div>

        {focusMessage && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "16px",
              ...supportCardStyle,
            }}
          >
            <p className="page-text" style={{ margin: 0 }}>
              {focusMessage}
            </p>
          </div>
        )}
      </div>

      <div className="content-card" style={{ textAlign: "center" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Focus Timer</h3>
        <p
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            margin: "0.5rem 0 1rem 0",
          }}
        >
          {formatTime(secondsLeft)}
        </p>
        <p className="page-text">Current pacing: {durationMinutes} minutes</p>

        <div
          className="button-row"
          style={{ justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}
        >
          <button className="secondary-button" onClick={handleGoSlower}>
            Go Slower
          </button>
          <button className="secondary-button" onClick={handleGoFaster}>
            Go Faster
          </button>
          <button className="primary-button" onClick={handleStartPause}>
            {isRunning ? "Pause" : "Start"}
          </button>
          <button className="secondary-button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="content-card">
        <h3 style={{ marginBottom: "1rem" }}>Calming Audio</h3>
        <p className="page-text">
          Choose a calming sound to make the focus session feel more comfortable.
        </p>

        <div className="button-row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            className={selectedSound === "rain" ? "primary-button" : "secondary-button"}
            onClick={() => setSelectedSound("rain")}
          >
            Rain
          </button>
          <button
            className={selectedSound === "white-noise" ? "primary-button" : "secondary-button"}
            onClick={() => setSelectedSound("white-noise")}
          >
            White Noise
          </button>
          <button
            className={selectedSound === "forest" ? "primary-button" : "secondary-button"}
            onClick={() => setSelectedSound("forest")}
          >
            Forest
          </button>
          <button className="secondary-button" onClick={handleToggleSound}>
            {isSoundPlaying ? "Stop Sound" : "Play Sound"}
          </button>
        </div>

        <p className="page-text" style={{ marginTop: "1rem" }}>
          Current sound: {selectedSound} {isSoundPlaying ? "(playing)" : "(stopped)"}
        </p>

        <audio ref={audioRef} hidden />
      </div>

      <div className="hero-card" style={supportCardStyle}>
        {currentTask && currentStep ? (
          <>
            <p className="eyebrow">Current Focus Step</p>
            <h3 style={{ fontSize: supportMode === "overwhelmed" ? "2.4rem" : "2rem", marginBottom: "0.75rem" }}>
              {currentStep.step_title}
            </h3>

            <p className="page-text" style={{ marginBottom: "0.75rem" }}>
              Task: {currentTask.title}
            </p>

            <p className="page-text" style={{ marginBottom: "0.5rem" }}>
              Step {currentStepIndex + 1} of {taskSteps.length}
            </p>

            <div
              style={{
                width: "100%",
                height: "10px",
                backgroundColor: "#e9edf7",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "1rem",
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

            {currentStep.visual_hint && (
              <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                {currentStep.visual_hint}
              </p>
            )}

            {currentStep.step_description && (
              <p className="page-text" style={{ fontSize: supportMode === "overwhelmed" ? "1.25rem" : "1.15rem" }}>
                {currentStep.step_description}
              </p>
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
                  Example: {currentStep.example_text}
                </p>
              </div>
            )}

            {supportMode === "overwhelmed" && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  borderRadius: "16px",
                  backgroundColor: "#fffdf4",
                  border: "1px solid #f5e6a8",
                }}
              >
                <p className="page-text" style={{ margin: 0 }}>
                  Try this: breathe in for 4 seconds, hold for 4 seconds, and breathe out for 4 seconds.
                </p>
              </div>
            )}

            <div
              className="button-row"
              style={{ marginTop: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}
            >
              <button className="secondary-button" onClick={handleNextStep}>
                Next Step
              </button>
              <button className="primary-button" onClick={handleMarkStepComplete}>
                Mark Step Complete
              </button>
              <button className="secondary-button" onClick={handleCompleteTask}>
                Complete Task
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">No Task Selected</p>
            <h3>Select a task to begin focus mode</h3>
            <p className="page-text">
              Choose one task from the list above to load its current step.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default FocusMode;