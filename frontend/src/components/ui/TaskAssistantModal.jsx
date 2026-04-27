import { useState, useEffect } from "react";

function TaskAssistantModal({ isOpen, onClose, task, onSaveSteps, petPreference = "🧸" }) {
  const [steps, setSteps] = useState([]);
  const [companionMessage, setCompanionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // NEW: Check who is logged in!
  const userRole = localStorage.getItem("current_user_role");
  const isParent = userRole === "parent";

  useEffect(() => {
    if (isOpen && task) {
      setCompanionMessage(
        isParent 
          ? `Drafting a mission plan for "${task.title}".` 
          : `Hi! Should I help you break "${task.title}" down into easy steps?`
      );
      setSteps([]);
      setErrorMessage("");
    }
  }, [isOpen, task, isParent]);

  if (!isOpen || !task) return null;

  const handleGenerateSteps = async () => {
    setIsLoading(true);
    setErrorMessage(""); 
    setCompanionMessage(isParent ? "Thinking... Drafting plan." : "Scanning my data banks...");

    try {
      const response = await fetch("http://localhost:8000/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_name: task.title, pet_type: petPreference }), 
      });
      const data = await response.json();
      
      if (data && Array.isArray(data.steps)) {
        setSteps(data.steps);
        setCompanionMessage(
          isParent 
            ? "Here is the draft! Edit, add, or remove steps below." 
            : "Here is our mission plan!"
        );
      } else {
        setErrorMessage("Oops! I got my wires crossed.");
      }
    } catch (error) {
      setErrorMessage("Hmm, my connection to the cloud is down.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepChange = (index, newValue) => {
    const newSteps = [...steps];
    newSteps[index].description = newValue;
    setSteps(newSteps);
  };

  const handleRemoveStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => { step.step_number = i + 1; });
    setSteps(newSteps);
  };

  const handleAddStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, description: "" }]);
  };

  const handleSaveAndClose = () => {
    const finalSteps = steps.filter(step => step.description.trim() !== "");
    onSaveSteps(finalSteps);
    onClose(); 
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div className="content-card" style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem", backgroundColor: "#F8FAFC", borderRadius: "24px" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "#E2E8F0", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748B", width: "36px", height: "36px", borderRadius: "50%" }}>✕</button>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div style={{ flexShrink: 0, fontSize: "4rem", animation: isLoading ? "pulse 1.5s infinite" : "none" }}>
            {isParent ? "🧠" : petPreference}
          </div>
          <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "20px 20px 20px 0", border: "2px solid #E2E8F0" }}>
            <p style={{ margin: 0, fontSize: "1.1rem", color: "#334155", fontWeight: "500" }}>{companionMessage}</p>
          </div>
        </div>

        {!steps.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button onClick={handleGenerateSteps} disabled={isLoading} className="primary-button" style={{ padding: "1rem 3rem", fontSize: "1.2rem", borderRadius: "16px" }}>
              {isLoading ? "Thinking..." : isParent ? "Generate AI Steps" : "Yes, please help me!"}
            </button>
          </div>
        )}

        {errorMessage && <div style={{ backgroundColor: "#FEF2F2", color: "#EF4444", padding: "1rem", borderRadius: "12px", marginTop: "1rem" }}>{errorMessage}</div>}

        {steps?.length > 0 && (
          <div style={{ animation: "fadeIn 0.5s ease-in" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
              {steps.map((step, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "white", padding: isParent ? "0.5rem 1rem" : "1rem 1.5rem", borderRadius: "16px", border: "1px solid #CBD5E1" }}>
                  <div style={{ backgroundColor: "#EEF2FF", color: "#6366F1", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
                    {step.step_number}
                  </div>
                  
                  {/* DYNAMIC RENDER: Input for Parent, Text for Child */}
                  {isParent ? (
                    <>
                      <input 
                        type="text" 
                        value={step.description}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        style={{ flex: 1, padding: "0.5rem", fontSize: "1.1rem", border: "none", outline: "none", color: "#334155" }}
                      />
                      <button onClick={() => handleRemoveStep(index)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "1.2rem", cursor: "pointer", padding: "0.5rem" }}>🗑️</button>
                    </>
                  ) : (
                    <span style={{ fontSize: "1.1rem", color: "#334155", fontWeight: "500" }}>{step.description}</span>
                  )}
                </div>
              ))}
            </div>

            {isParent && (
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                <button onClick={handleAddStep} style={{ background: "none", border: "2px dashed #CBD5E1", padding: "0.5rem 2rem", borderRadius: "12px", color: "#64748B", fontWeight: "bold", cursor: "pointer" }}>+ Add Manual Step</button>
              </div>
            )}

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSaveAndClose} style={{ padding: "1rem 2rem", fontSize: "1.1rem", borderRadius: "12px", backgroundColor: "#10B981", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                {isParent ? "Approve & Save Task" : "Accept Mission!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskAssistantModal;