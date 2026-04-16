import { useState } from "react";
import tasks from "../../data/tasks";

function TaskAssistantModal({ isOpen, onClose }) {
  const [taskInput, setTaskInput] = useState("");
  const [steps, setSteps] = useState([]);
  const [companionMessage, setCompanionMessage] = useState("Hi there! I'm Nova. What are we working on today?");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleCreateTask = async () => {
    if (!taskInput.trim()) return;
    
    setIsLoading(true);
    setErrorMessage(""); 
    setSteps([]); 
    // Nova "thinking" state
    setCompanionMessage("Thinking... Let me scan my data banks for the best way to do this!");

    try {
      const response = await fetch("http://localhost:8000/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_name: taskInput }),
      });
      const data = await response.json();
      
      if (data && Array.isArray(data.steps)) {
        setSteps(data.steps);
        // NEW: Set Nova's specific message from the AI!
        setCompanionMessage(data.companion_message || "Here is our mission plan!");
      } else {
        setErrorMessage("Oops! I got my wires crossed. Could you try typing that differently?");
        setCompanionMessage("Uh oh, something went wrong.");
      }
    } catch (error) {
      setErrorMessage("Hmm, my connection to the cloud is down. Is the backend server running?");
      setCompanionMessage("I can't connect right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateTask();
  };

  const handleSaveAndClose = () => {
    const newTask = {
      id: Date.now(),
      title: taskInput,
      category: "My Tasks",
      stepsCount: steps.length,
      estimatedMinutes: steps.length * 5,
      steps: steps 
    };
    
    tasks.unshift(newTask); 
    
    // Reset state
    setTaskInput("");
    setSteps([]);
    setErrorMessage(""); 
    setCompanionMessage("Hi there! I'm Nova. What are we working on today?");
    onClose(); 
    window.location.href = "/child";
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      
      <div className="content-card" style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem", backgroundColor: "#F8FAFC", borderRadius: "24px" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "#E2E8F0", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748B", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>

        {/* --- COMPANION AREA --- */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", marginBottom: "2rem" }}>
          
          {/* Avatar Image (Pulsing slightly if loading) */}
          <div style={{ flexShrink: 0, opacity: isLoading ? 0.7 : 1, transition: "opacity 0.3s" }}>
             <img 
               src="/nova-robot.png" 
               alt="Nova the Robot" 
               style={{ width: "120px", height: "auto", filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.1))" }} 
             />
          </div>

          {/* Speech Bubble */}
          <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "20px 20px 20px 0", border: "2px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: "relative" }}>
            <p style={{ margin: 0, fontSize: "1.1rem", color: "#334155", lineHeight: "1.5", fontWeight: "500" }}>
              {companionMessage}
            </p>
          </div>
        </div>

        {/* --- INPUT AREA --- */}
        {!steps.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Pack my school bag..."
              style={{ flex: 1, padding: "1rem", fontSize: "1.1rem", borderRadius: "12px", border: "2px solid #CBD5E1", outline: "none" }}
            />
            <button 
              onClick={handleCreateTask} 
              disabled={isLoading} 
              style={{ padding: "0 2rem", fontSize: "1.1rem", borderRadius: "12px", backgroundColor: "#6366F1", color: "white", border: "none", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              {isLoading ? "..." : "Ask Nova"}
            </button>
          </div>
        )}

        {errorMessage && (
           <div style={{ backgroundColor: "#FEF2F2", color: "#EF4444", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", fontWeight: "500" }}>
             {errorMessage}
           </div>
        )}

        {/* --- TASK STEPS AREA --- */}
        {steps?.length > 0 && (
          <div style={{ animation: "fadeIn 0.5s ease-in" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
              {steps.map((step) => (
                <div key={step.step_number} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "white", padding: "1rem 1.5rem", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ backgroundColor: "#EEF2FF", color: "#6366F1", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
                    {step.step_number}
                  </div>
                  <span style={{ fontSize: "1.1rem", color: "#334155", fontWeight: "500" }}>{step.description}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSaveAndClose} 
                style={{ padding: "1rem 2rem", fontSize: "1.1rem", borderRadius: "12px", backgroundColor: "#10B981", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)" }}
              >
                Accept Mission!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskAssistantModal;