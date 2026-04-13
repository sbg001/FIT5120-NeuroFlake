import { useState } from "react";
import tasks from "../../data/tasks";

function TaskAssistantModal({ isOpen, onClose }) {
  const [taskInput, setTaskInput] = useState("");
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleCreateTask = async () => {
    if (!taskInput.trim()) return;
    
    setIsLoading(true);
    setErrorMessage(""); 
    setSteps([]); 

    try {
      const response = await fetch("http://localhost:8000/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_name: taskInput }),
      });
      const data = await response.json();
      
      if (data && Array.isArray(data.steps)) {
        setSteps(data.steps);
      } else {
        console.error("The AI returned unexpected data:", data);
        setErrorMessage("Oops! The helper got a little confused. Could you try typing that task slightly differently?");
      }
    } catch (error) {
      console.error("Failed to fetch steps:", error);
      setErrorMessage("Hmm, I couldn't connect to the helper. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to listen for the Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    }
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
    
    // Push the new task into your mock data array
    tasks.unshift(newTask); 
    
    setTaskInput("");
    setSteps([]);
    setErrorMessage(""); 
    onClose(); 

    // Force the browser to go to the child dashboard and refresh.
    // This forces React to re-read the tasks.js file and draw the new task!
    window.location.href = "/child";
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="content-card" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        
        <button onClick={() => { onClose(); setErrorMessage(""); }} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}>
          ✕
        </button>

        <h2 className="page-title" style={{ marginTop: "1rem" }}>Need help breaking it down?</h2>
        <p className="page-text" style={{ marginBottom: "2rem" }}>Type your task below.</p>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Clean my bedroom"
            style={{ flex: 1, padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          <button onClick={handleCreateTask} disabled={isLoading} className="primary-button">
            {isLoading ? "Thinking..." : "Help Me"}
          </button>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: "#FFF4E5", color: "#D97706", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #FDE68A", textAlign: "left", fontSize: "0.95rem" }}>
            <span role="img" aria-label="lightbulb" style={{ marginRight: "0.5rem" }}>💡</span>
            {errorMessage}
          </div>
        )}

        {steps?.length > 0 && (
          <>
            <h3>Here are your simple steps:</h3>
            <div className="card-grid" style={{ marginTop: "1rem" }}>
              {steps.map((step) => (
                <article key={step.step_number} className="feature-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", textAlign: "left" }}>
                  <input type="checkbox" style={{ width: "1.5rem", height: "1.5rem", cursor: "pointer", marginTop: "0.2rem", flexShrink: 0 }} />
                  <span style={{ fontSize: "1.1rem", lineHeight: "1.4" }}>{step.description}</span>
                </article>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button onClick={handleSaveAndClose} className="primary-button">
                Add to Tasks & Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskAssistantModal;