import { useState, useEffect, useRef, useCallback } from "react";
import { getChildPreferences, getTasks, getTaskById } from "../../services";
import BuddyIcon from "./BuddyIcon";
import "./FloatingCompanion.css";

const CHAT_API_URL = `${import.meta.env.VITE_CHATBOT_API_URL || ""}/api/chat`;
const SENTIMENT_API_URL = `${import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8000"}/api/analyze-sentiment`;

async function analyseAndStore(messageText, taskContext = null) {
  try {
    const res = await fetch(SENTIMENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: messageText, task_context: taskContext || null }),
    });
    const result = await res.json();
    console.log("Sentiment result:", result); // ADD THIS

    const existing = JSON.parse(localStorage.getItem("neuroflake_emotion_log") || "[]");
    existing.push(result);

    const today = new Date().toISOString().slice(0, 10); // "2026-05-14"
    const todayOnly = existing.filter(
      (entry) => entry.timestamp && entry.timestamp.slice(0, 10) === today
    );
    console.log("Saving to localStorage:", todayOnly); // ADD THIS
    localStorage.setItem("neuroflake_emotion_log", JSON.stringify(todayOnly));
  } catch (e) {
    console.error("analyseAndStore failed:", e); // ADD THIS
  }
}
// 1. The NEW Pixel Art Configuration
const petConfig = {
  cat: { 
    images: { awake: "/pets/cat_awake.gif", happy: "/pets/cat_happy.gif", asleep: "/pets/cat_asleep.gif" },
    greetings: ["*Meow!*", "*Prrr...* Ready?", "Hi there, *meow*!"]
  },
  dog: { 
    images: { awake: "/pets/dog_awake.gif", happy: "/pets/dog_happy.gif", asleep: "/pets/dog_asleep.gif" }, 
    greetings: ["*Woof!*", "*Arf!* Let's do this!", "*Pant pant*"]
  },
  bear: { 
    images: { awake: "/pets/bear_awake.gif", happy: "/pets/bear_happy.gif", asleep: "/pets/bear_asleep.gif" }, 
    greetings: ["*Rawr!*", "Big bear hug!", "*Grrr...* Let's go!"]
  },
  turtle: { 
    images: { awake: "/pets/turtle_awake.gif", happy: "/pets/turtle_happy.gif", asleep: "/pets/turtle_asleep.gif" }, 
    greetings: ["*Snap!*", "Slow and steady!", "Shell yeah!"]
  },
  robot: { 
    images: { awake: "/pets/robot_awake.gif", happy: "/pets/robot_happy.gif", asleep: "/pets/robot_asleep.gif" }, 
    greetings: ["*Beep boop!*", "System ready.", "*Whirrr...*"]
  },
  star: { 
    images: { awake: "/pets/star_awake.gif", happy: "/pets/star_happy.gif", asleep: "/pets/star_asleep.gif" }, 
    greetings: ["*Twinkle!*", "Shine bright!", "*Sparkle sparkle*"]
  },
  guide: { 
    // Fallback for the parent dashboard
    images: { awake: "🧭", happy: "🧭" }, 
    greetings: ["Hello!", "At your service."] 
  }
};

function FloatingCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState({ type: "dog" });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  
  // 2. NEW STATES for the greeting animation
  const [isGreeting, setIsGreeting] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState("");
  const [emotionState, setEmotionState] = useState("idle");

  const messagesEndRef = useRef(null);
  const tasksContextRef = useRef("");
  const userRole = localStorage.getItem("current_user_role") || "child";
  const isParent = userRole === "parent";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadPet = useCallback(async () => {
    if (isParent) {
      setPetData({ type: "guide" });
      setMessages([
        {
          id: 1,
          sender: "bot",
          text: "Hello! I'm your NeuroFlake Parent Guide. Do you have any questions about supporting your child today?",
        },
      ]);
      return;
    }

    try {
      const { data } = await getChildPreferences();
      const rawStyle = String(data?.character_style || "dog").toLowerCase();
      const selectedType = petConfig[rawStyle] ? rawStyle : "dog";
      setPetData({ type: selectedType });
    } catch {
      setPetData({ type: "dog" });
    }

    setMessages([
      { id: 1, sender: "bot", text: "Hi! I'm here for you. How are you doing today?" },
    ]);
  }, [isParent]);

  useEffect(() => {
    loadPet();
    window.addEventListener("preferencesUpdated", loadPet);
    return () => window.removeEventListener("preferencesUpdated", loadPet);
  }, [loadPet]);

  const loadTasksContext = useCallback(async () => {
    if (isParent) {
      tasksContextRef.current = "";
      return;
    }

    try {
      const tasksRes = await getTasks();
      const pendingTasks = (tasksRes.data || []).filter(task => task.status !== "completed");
      tasksContextRef.current = pendingTasks.length > 0
        ? pendingTasks.map((task, index) => `${index + 1}. ${task.title}`).join("\n")
        : "All tasks completed! They have free time.";
    } catch {
      tasksContextRef.current = "";
    }
  }, [isParent]);

  // Listen for app events
  useEffect(() => {
    const handleEmotionEvent = (event) => {
      setEmotionState(event.detail); // Will be 'success' or 'struggle'
      
      // Revert back to awake/idle after 4 seconds
      setTimeout(() => {
        setEmotionState("idle");
      }, 4000);
    };

    window.addEventListener("companionEmotion", handleEmotionEvent);
    return () => window.removeEventListener("companionEmotion", handleEmotionEvent);
  }, []);

  useEffect(() => {
    if (isOpen) loadTasksContext();
  }, [isOpen, loadTasksContext]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newMsg = { id: Date.now(), sender: "user", text: userText };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Silently analyse the child's message for the parent's Emotion Insights panel
    if (!isParent) {
      let taskContextForSentiment = null;
      try {
        const currentPath = window.location.pathname;
        if (currentPath.includes("/tasks/")) {
          const taskId = currentPath.split("/tasks/")[1];
          const taskRes = await getTaskById(taskId);
          if (taskRes?.data) taskContextForSentiment = taskRes.data.title;
        }
      } catch {
        // ignore
      }
      analyseAndStore(userText, taskContextForSentiment);
    }

    try {
      const formattedHistory = messages.slice(-6).map((msg) => ({
        role: msg.sender === "bot" ? "assistant" : "user",
        content: msg.text,
      }));
      let activeTaskString = "";

      if (!isParent) {
        try {
          const currentPath = window.location.pathname;
          if (currentPath.includes("/tasks/")) {
            const taskId = currentPath.split("/tasks/")[1];
            const taskRes = await getTaskById(taskId);
            if (taskRes && taskRes.data) {
              activeTaskString = `"${taskRes.data.title}" - ${taskRes.data.description}`;
            }
          }
        } catch (e) {
          console.error("Could not fetch task context.", e);
        }
      }

      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          pet_type: petData.type,
          history: formattedHistory,
          user_role: userRole,
          tasks_context: tasksContextRef.current,
          active_task_context: activeTaskString,
        }),
      });

      const data = await response.json();

      if (data && data.reply) {
        const rawSentences = data.reply.match(/[^.!?]+[.!?]*/g) || [data.reply];
        const sentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);

        sentences.forEach((sentence, index) => {
          setTimeout(() => {
            setMessages((prev) => [...prev, { id: Date.now() + index, sender: "bot", text: sentence }]);
          }, index * 800); 
        });
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: "Oops, my connection dropped! Could you say that again?" },
      ]);
    }
  };

  // 3. NEW Click Handler for the Pet Animation
  const handlePetInteraction = () => {
    setIsOpen(!isOpen); 
    if (isGreeting || isParent) return;

    const safeConfig = petConfig[petData.type] || petConfig.dog;
    const randomGreeting = safeConfig.greetings[Math.floor(Math.random() * safeConfig.greetings.length)];
    
    setCurrentGreeting(randomGreeting);
    setIsGreeting(true);

    setTimeout(() => {
      setIsGreeting(false);
    }, 2500);
  };

  // 4. Safely determine which image to show
  const currentPetConfig = petConfig[petData.type] || petConfig.dog;
  const safeImages = currentPetConfig.images || {};
  // DEFAULT STATE: The pet is peacefully asleep
  let currentImage = safeImages.asleep || "/pets/dog.gif"; 

  // OVERRIDES: Change the image based on what is happening
  if (emotionState === "success") {
    // Top Priority: If a task is finished, they celebrate! (Happy)
    // Note: This still uses the 4-second timeout so the celebration eventually ends!
    currentImage = safeImages.happy || currentImage;
  } else if (isOpen) {
    // WIDE AWAKE: If the chat window is OPEN, the cat stays awake permanently!
    currentImage = safeImages.awake || currentImage;
  } else if (emotionState === "struggle") {
    // If overwhelmed, they stay asleep to keep the screen calm
    currentImage = safeImages.asleep || currentImage;
  }

  return (
    <div className="companion-container">
      {isOpen ? (
        <div className="companion-chat-window">
          <div style={{ backgroundColor: "#EEF2FF", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "bold", color: "#312E81", fontSize: "1.1rem" }}>
              {isParent ? "🧭" : (
                <img 
                    src={safeImages.awake || "/pets/dog.gif"} 
                    alt="buddy icon" 
                    style={{ width: "28px", height: "28px", imageRendering: "pixelated", mixBlendMode: "multiply" }} 
                 />
              )}
              Buddy Helper
            </span>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#64748B" }}>
              {"\u2715"}
            </button>
          </div>

          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#F8FAFC" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#6366F1" : "#E0E7FF", color: msg.sender === "user" ? "white" : "#312E81", padding: "8px 14px", borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0", maxWidth: "80%", fontSize: "0.95rem" }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", display: "flex", gap: "10px", boxSizing: "border-box" }}>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Say hello..." style={{ flex: 1, padding: "10px 16px", borderRadius: "20px", border: "1px solid #CBD5E1", outline: "none", fontSize: "0.95rem" }} />
            <button type="submit" style={{ backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {"\u27A4"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="companion-avatar" onClick={handlePetInteraction}>
        {!isParent && !isOpen ? (
          <div className="companion-avatar__hint" role="note">
            <span>Your AI buddy</span>
          </div>
        ) : null}
        <div className={`greeting-bubble ${isGreeting ? 'visible' : ''}`}>
          {currentGreeting}
        </div>
        <div className={`buddy-wrapper ${isGreeting ? 'jump-anim' : 'float-anim'}`}>
          {isParent ? (
            <span style={{ fontSize: "3rem" }}>🧭</span>
          ) : (
             <img src={currentImage} alt={`${petData?.type} buddy`} className="pixel-pet" draggable="false" />
          )}
        </div>
      </div>
    </div>
  );
}

export default FloatingCompanion;
