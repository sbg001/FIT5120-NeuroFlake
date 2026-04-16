import { useState, useEffect } from "react";

function TaskAssistantModal({ isOpen, onClose, task, onSaveSteps }) {
  const [steps, setSteps] = useState([]);
  const [companionMessage, setCompanionMessage] = useState("Hi there! I'm Nova. What are we working on today?");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setCompanionMessage(`Hi! I see we need to work on ${task.title}. Should I help you break this down into easy steps?`);
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
      const response = await fetch("http://localhost:8000/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Automatically send the task title, no typing required!
        body: JSON.stringify({ task_name: task.title }), 
      });
      const data = await response.json();
      
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
    // Instead of saving to a local array, we pass the steps back to the Task Page 
    // so it can save them to Supabase!
    onSaveSteps(steps);
    onClose(); 
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      
      <div className="content-card" style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem", backgroundColor: "#F8FAFC", borderRadius: "24px" }}>
        
        {/* We can optionally hide the close button so they have to interact with Nova, but keeping it for safety is good UX */}
        <button onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "#E2E8F0", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748B", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div style={{ flexShrink: 0, opacity: isLoading ? 0.7 : 1, transition: "opacity 0.3s" }}>
             <img src="/nova-robot.png" alt="Nova the Robot" style={{ width: "120px", height: "auto", filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.1))" }} />
          </div>
          <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "20px 20px 20px 0", border: "2px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: 0, fontSize: "1.1rem", color: "#334155", lineHeight: "1.5", fontWeight: "500" }}>
              {companionMessage}
            </p>
          </div>
        </div>

        {/*DYNAMIC ACTION AREA*/}
        {!steps.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button 
              onClick={handleGenerateSteps} 
              disabled={isLoading} 
              className="primary-button"
              style={{ padding: "1rem 3rem", fontSize: "1.2rem", borderRadius: "16px", backgroundColor: "#6366F1", boxShadow: "0 4px 6px rgba(99, 102, 241, 0.3)" }}
            >
              {isLoading ? "Thinking..." : "Yes, please help me!"}
            </button>
          </div>
        )}

        {errorMessage && (
           <div style={{ backgroundColor: "#FEF2F2", color: "#EF4444", padding: "1rem", borderRadius: "12px", marginTop: "1rem", fontWeight: "500" }}>
             {errorMessage}
           </div>
        )}

        {steps?.length > 0 && (
          <div style={{ animation: "fadeIn 0.5s ease-in" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
              {steps.map((step) => (
                <div key={step.step_number} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "white", padding: "1rem 1.5rem", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
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
