import { useState, useEffect, useRef } from "react";
import { getChildPreferences } from "../../services"; 
import "./FloatingCompanion.css"; 

function FloatingCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState({ type: "bear" });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  
  // NEW: Track the current emotion of the pet
  const [emotionState, setEmotionState] = useState("idle"); // 'idle', 'success', 'struggle'
  const messagesEndRef = useRef(null);
  const userRole = localStorage.getItem("current_user_role") || "child";
  const isParent = userRole === "parent";

  // --- THE EMOJI MAP ---
  // This maps the pet type and the emotional state to the correct emoji!
  const petExpressions = {
    cat: { idle: "🐱", success: "😻", struggle: "😿" },
    dog: { idle: "🐶", success: "🐕🎉", struggle: "🥺" },
    bear: { idle: "🧸", success: "🧸✨", struggle: "🧸💙" },
    star: { idle: "⭐", success: "🌟", struggle: "💫" },
    guide: { idle: "🧭", success: "🧭", struggle: "🧭" }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadPet = async () => {
    // IF PARENT: Set up the professional guide interface
    if (isParent) {;
      setPetData({ type: "guide", emoji: petExpressions.guide.idle });
      setMessages([{ 
        id: 1, 
        sender: "bot", 
        text: `Hello! I'm your NeuroFlake Parent Guide. Do you have any questions about supporting your child today?` 
      }]);
      return; // Exit early, we don't need to fetch child preferences!
    }
    // IF CHILD: Do the normal pet fetch
    const { data } = await getChildPreferences();
    const rawStyle = String(data?.character_style || "bear").toLowerCase();
    
    let selectedType = "bear"; 
    if (rawStyle.includes("cat")) selectedType = "cat";
    else if (rawStyle.includes("dog")) selectedType = "dog";
    else if (rawStyle.includes("star")) selectedType = "star";

    setPetData({ type: selectedType });
    setMessages([{ id: 1, sender: "bot", text: `Hi! I'm here for you. How are you doing today?` }]);
  };

  useEffect(() => {
    loadPet();
    window.addEventListener("preferencesUpdated", loadPet);

    // --- NEW: LISTEN FOR EMOTIONAL EVENTS ---
    const handleEmotionEvent = (e) => {
      const newEmotion = e.detail; // 'success' or 'struggle'
      setEmotionState(newEmotion);
      
      // Auto-revert back to idle after 4 seconds
      setTimeout(() => {
        setEmotionState("idle");
      }, 4000);
    };

    window.addEventListener("companionEmotion", handleEmotionEvent);
    
    return () => {
      window.removeEventListener("preferencesUpdated", loadPet);
      window.removeEventListener("companionEmotion", handleEmotionEvent);
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newMsg = { id: Date.now(), sender: "user", text: userText };
    
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue("");

    try {
      const formattedHistory = messages.slice(-6).map(msg => ({
        role: msg.sender === "bot" ? "assistant" : "user",
        content: msg.text
      }));

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          pet_type: petData.type,
          history: formattedHistory,
          user_role: userRole // <--- NEW: Send the role to Python!
        }),
      });

      const data = await response.json();

      if (data && data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: "bot", text: data.reply },
        ]);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: "Oops, my connection dropped! Could you say that again?" },
      ]);
    }
  };

// Determine the final animation class based on the emotion state
  const getAnimationClass = () => {
    if (emotionState === "success") return "anim-success";
    if (emotionState === "struggle") return "anim-struggle";
    
    // Parents don't get playful idle animations
    if (isParent) return "";

    // If idle, return their signature animation
    switch (petData.type) {
      case "dog": return "anim-dog";
      case "cat": return "anim-cat";
      case "star": return "anim-star";
      default: return "anim-bear";
    }
  };

  // Get the current face of the pet
  const currentFace = petExpressions[petData.type][emotionState];

  return (
    <div className="companion-container">
      
      {/* THE CHAT WINDOW */}
      {isOpen && (
        <div className="companion-chat-window">
          {/* Header */}
          <div style={{ backgroundColor: "#EEF2FF", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "bold", color: "#312E81", fontSize: "1.1rem" }}>
              {petData.emoji} My Companion
            </span>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#64748B" }}>✕</button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#F8FAFC" }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#6366F1" : "#E0E7FF", color: msg.sender === "user" ? "white" : "#312E81", padding: "8px 14px", borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0", maxWidth: "80%", fontSize: "0.95rem" }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} style={{ padding: "12px", borderTop: "1px solid #E2E8F0", display: "flex", gap: "8px" }}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Say hello..." 
              style={{ flex: 1, padding: "8px 12px", borderRadius: "20px", border: "1px solid #CBD5E1", outline: "none" }}
            />
            <button type="submit" style={{ backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              ➤
            </button>
          </form>
        </div>
      )}

      {/* THE FLOATING AVATAR */}
      <div 
        className={`companion-avatar ${getAnimationClass()}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentFace}
      </div>
      
    </div>
  );
}

export default FloatingCompanion;