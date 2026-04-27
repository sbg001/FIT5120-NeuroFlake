import { useEffect, useState } from "react";
import {
  getTaskById,
  getTaskSteps,
  completeStep,
  completeTask,
  getPointsBalance,
  createRewardTransaction,
  updatePointsBalance,
  createTaskStep,
  updateTaskStepCount,
  getChildPreferences
} from "../services";
import { useNavigate, useParams } from "react-router-dom";
import TaskAssistantModal from "../components/ui/TaskAssistantModal";

function TaskFlow() {
  const [task, setTask] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taskReady, setTaskReady] = useState(true);
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [emotion, setEmotion] = useState(null); // Fixed string "null" to actual null
  const [petPreference, setPetPreference] = useState("🐶");

  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTask() {
      setLoading(true);

      const { data: taskData } = await getTaskById(taskId);
      const { data: stepsData } = await getTaskSteps(taskId);

      const orderedSteps = stepsData || [];
      const validStepCount = orderedSteps.length >= 2 && orderedSteps.length <= 5;

      const { data: prefData } = await getChildPreferences();
      const characterMap = { star: "⭐", rocket: "🚀", bear: "🧸", cat: "🐱", dog: "🐶", fox: "🦊" };
      
      const chosenPet = characterMap[prefData?.character_style] || "🧸";
      setPetPreference(chosenPet);

      setTask(taskData);
      setSteps(orderedSteps);
      setTaskReady(validStepCount);

      const firstIncompleteIndex = orderedSteps.findIndex(step => step.is_completed === false);
      
      if (firstIncompleteIndex === -1 && orderedSteps.length > 0) {
        setCurrentStepIndex(orderedSteps.length - 1);
      } else {
        setCurrentStepIndex(firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0);
      }

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
  const progressPercent = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const handleNext = async () => {
    if (!currentStep) return;

    await completeStep(taskId, currentStep.step_id);

    // --- AC 7.1.2: TRIGGER CELEBRATION EMOTION! ---
    window.dispatchEvent(new CustomEvent("companionEmotion", { detail: "success" }));

    if (currentStepIndex < steps.length - 1) {
      const updatedSteps = steps.map((step, index) =>
        index === currentStepIndex
          ? { ...step, is_completed: true, completed_at: new Date().toISOString() }
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
            ? { ...step, is_completed: true, completed_at: new Date().toISOString() }
            : step
        )
      );

      setTask((prevTask) => (prevTask ? { ...prevTask, status: "completed" } : prevTask));

      navigate("/rewards", { state: { showCelebration: true } });
    }
  };

  const handleStepsSaved = async (generatedSteps) => {
    try {
      for (const step of generatedSteps) {
        await createTaskStep({
          task_id: taskId,
          step_title: step.description, 
          step_order: step.step_number
        });
      }
      
      await updateTaskStepCount(taskId);
      window.location.reload();
      
    } catch (error) {
      console.error("Failed to save Nova's steps:", error);
    }
  };

  if (!taskId) return <p className="page-text">No task selected</p>;
  if (loading) return <p className="page-text">Loading task...</p>;
  if (!task) return <p className="page-text">No task available</p>;

  if (!taskReady) {
    return (
      <div>
        <section className="page-section">
          <div className="content-card">
            <p className="eyebrow">Task Flow</p>
            <h2 className="page-title">{task.title}</h2>
            <p className="page-text">
              This task needs 2 to 5 simple steps before it can start.
            </p>
            
            <div style={{ marginTop: "1.5rem" }}>
              <button 
                onClick={() => setIsNovaOpen(true)}
                className="primary-button"
                style={{ padding: "0.75rem 1.5rem", fontSize: "1.1rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span role="img" aria-label="companion">{petPreference}</span> I need help with this
              </button>
            </div>
          </div>
        </section>

        <TaskAssistantModal 
          isOpen={isNovaOpen} 
          onClose={() => {
            setIsNovaOpen(false);
            if (steps.length === 0) navigate(-1);
          }} 
          task={task} 
          onSaveSteps={handleStepsSaved} 
          petPreference={petPreference}
        />
      </div>
    );
  }

  return (
    <section className="page-section">
      <div className="content-card">
        <p className="eyebrow">Task Flow</p>
        <h2 className="page-title">{task.title}</h2>
        <p className="page-text">{task.description}</p>
        <p className="page-text">Step {currentStepIndex + 1} of {steps.length}</p>

        <div style={{ width: "100%", height: "10px", backgroundColor: "#e9edf7", borderRadius: "999px", overflow: "hidden", marginTop: "0.75rem" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "#6c8ff0" }} />
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "1.5rem" }}>
        
        {!emotion ? (
          <div style={{ textAlign: "center", padding: "2rem 0", animation: "fadeIn 0.5s ease-in" }}>
            <div style={{ fontSize: "5rem", animation: "bounce 2s infinite" }}>{petPreference}</div>
            <h3 style={{ marginTop: "1rem", fontSize: "1.4rem", color: "#1E293B" }}>Hi friend! How are you feeling right now?</h3>
            
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
              {/* Trigger Success for Happy (Optional, but nice UX) */}
              <button onClick={() => {
                setEmotion("happy");
                window.dispatchEvent(new CustomEvent("companionEmotion", { detail: "success" }));
              }} className="secondary-button" style={{ fontSize: "1.1rem", padding: "1rem 2rem", borderRadius: "16px", backgroundColor: "#D1FAE5", color: "#065F46", border: "none" }}>🟢 Good / Happy</button>
              
              <button onClick={() => setEmotion("tired")} className="secondary-button" style={{ fontSize: "1.1rem", padding: "1rem 2rem", borderRadius: "16px", backgroundColor: "#FEF3C7", color: "#92400E", border: "none" }}>🟡 Tired</button>
              
              {/* --- AC 7.1.2: TRIGGER EMPATHETIC STRUGGLE EMOTION! --- */}
              <button onClick={() => {
                setEmotion("overwhelmed");
                window.dispatchEvent(new CustomEvent("companionEmotion", { detail: "struggle" }));
              }} className="secondary-button" style={{ fontSize: "1.1rem", padding: "1rem 2rem", borderRadius: "16px", backgroundColor: "#FEE2E2", color: "#991B1B", border: "none" }}>🔴 Overwhelmed</button>
            </div>
          </div>
        ) : (
          
          <div style={{ animation: "fadeIn 0.5s ease-in" }}>
            <p className="eyebrow">My Step Plan</p>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginTop: "1rem" }}>
              <div style={{ flexShrink: 0, marginTop: "0.5rem", fontSize: "4rem" }}>
                {petPreference}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", flex: 1 }}>
                
                <div style={{ padding: "1rem", borderRadius: "0 20px 20px 20px", backgroundColor: "#F8FAFC", border: "2px solid #E2E8F0", marginBottom: "1rem" }}>
                  <p style={{ margin: 0, fontSize: "1.05rem", color: "#334155", fontStyle: "italic" }}>
                    {emotion === "happy" && "I love that energy! Let's tackle these steps together."}
                    {emotion === "tired" && "I'm sleepy too. Let's just go slow and take our time."}
                    {emotion === "overwhelmed" && "It is okay to feel big things. Let's take a deep breath before we look at the first step."}
                  </p>
                </div>

                {steps.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = step.is_completed;

                  return (
                    <div key={step.step_id} style={{ padding: "1rem", borderRadius: "0 20px 20px 20px", backgroundColor: isActive ? "#EEF2FF" : isCompleted ? "#F8FAFC" : "#FFFFFF", border: isActive ? "2px solid #6366F1" : "1px solid #E2E8F0", opacity: isCompleted ? 0.6 : 1, display: "flex", alignItems: "center", gap: "0.75rem", transition: "all 0.3s ease" }}>
                      <div style={{ fontSize: "1.2rem", flexShrink: 0 }}>{isCompleted ? "✅" : isActive ? "👉" : "⏳"}</div>
                      <span style={{ fontSize: "1.05rem", color: isActive ? "#312E81" : "#475569", fontWeight: isActive ? "600" : "500", textDecoration: isCompleted ? "line-through" : "none" }}>
                        {step.step_title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {currentStep && (
        <div className="hero-card">
          <p className="eyebrow">Current Step</p>
          <h3>{currentStep.step_title}</h3>
          <p>{currentStep.step_description}</p>

          {currentStep.visual_hint && <p className="page-text">Visual hint: {currentStep.visual_hint}</p>}
          {currentStep.example_text && (
            <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "16px", backgroundColor: "#f8faff", border: "1px solid #d8dbe8" }}>
              <p className="page-text" style={{ margin: 0 }}>Try this: {currentStep.example_text}</p>
            </div>
          )}

          <p className="page-text" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            Start with this step, then move forward one step at a time.
          </p>

          <div className="button-row">
            <button className="primary-button" onClick={handleNext} disabled={!currentStep}>
              {currentStepIndex === 0 ? "Start Task" : currentStepIndex === steps.length - 1 ? task.status === "completed" ? "Task Completed" : "Finish Task" : "Mark Step Complete"}
            </button>
          </div>
        </div>
      )}

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