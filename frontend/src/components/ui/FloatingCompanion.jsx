import { useState, useEffect, useRef, useCallback } from "react";
import { getChildPreferences, getTasks, getTaskById } from "../../services";
import "./FloatingCompanion.css";

const CHAT_API_URL = `${import.meta.env.VITE_CHATBOT_API_URL || ""}/api/chat`;

const petExpressions = {
  cat: { idle: "\u{1F431}", success: "\u{1F63B}", struggle: "\u{1F63F}" },
  dog: { idle: "\u{1F436}", success: "\u{1F415}\u{1F389}", struggle: "\u{1F97A}" },
  bear: { idle: "\u{1F9F8}", success: "\u{1F9F8}\u2728", struggle: "\u{1F9F8}\u{1F499}" },
  star: { idle: "\u2B50", success: "\u{1F31F}", struggle: "\u{1F4AB}" },
  guide: { idle: "\u{1F9ED}", success: "\u{1F9ED}", struggle: "\u{1F9ED}" },
};

function FloatingCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState({ type: "bear", emoji: "\u{1F9F8}" });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
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
      setPetData({ type: "guide", emoji: petExpressions.guide.idle });
      setMessages([
        {
          id: 1,
          sender: "bot",
          text: "Hello! I'm your NeuroFlake Parent Guide. Do you have any questions about supporting your child today?",
        },
      ]);
      return;
    }

    const { data } = await getChildPreferences();
    const rawStyle = String(data?.character_style || "bear").toLowerCase();

    let selectedType = "bear";
    if (rawStyle.includes("cat")) selectedType = "cat";
    else if (rawStyle.includes("dog")) selectedType = "dog";
    else if (rawStyle.includes("star")) selectedType = "star";

    setPetData({ type: selectedType, emoji: petExpressions[selectedType].idle });
    setMessages([
      { id: 1, sender: "bot", text: "Hi! I'm here for you. How are you doing today?" },
    ]);
  }, [isParent]);

  useEffect(() => {
    loadPet();
    window.addEventListener("preferencesUpdated", loadPet);

    const handleEmotionEvent = (event) => {
      const newEmotion = event.detail;
      setEmotionState(newEmotion);

      setTimeout(() => {
        setEmotionState("idle");
      }, 4000);
    };

    window.addEventListener("companionEmotion", handleEmotionEvent);

    return () => {
      window.removeEventListener("preferencesUpdated", loadPet);
      window.removeEventListener("companionEmotion", handleEmotionEvent);
    };
  }, [loadPet]);

  const loadTasksContext = useCallback(async () => {
    if (isParent) {
      tasksContextRef.current = "";
      return;
    }

    try {
      const tasksRes = await getTasks();
      const pendingTasks = (tasksRes.data || []).filter(
        (task) => task.status !== "completed"
      );

      tasksContextRef.current =
        pendingTasks.length > 0
          ? pendingTasks.map((task, index) => `${index + 1}. ${task.title}`).join("\n")
          : "All tasks completed! They have free time.";
    } catch {
      tasksContextRef.current = "";
    }
  }, [isParent]);

  useEffect(() => {
    if (isOpen) {
      loadTasksContext();
    }
  }, [isOpen, loadTasksContext]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newMsg = { id: Date.now(), sender: "user", text: userText };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    try {
      const formattedHistory = messages.slice(-6).map((msg) => ({
        role: msg.sender === "bot" ? "assistant" : "user",
        content: msg.text,
      }));
      let activeTaskString = "";

      if (!isParent) {
        try {
          // Check if the user is currently looking at a specific task page
          const currentPath = window.location.pathname;
          const isTaskPage = currentPath.includes("/tasks/");
          
          if (isTaskPage) {
            // Extract the task ID from the URL (e.g., "/tasks/123" -> "123")
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
        // 1. Split the AI's response into individual sentences.
        // This Regex looks for chunks of text ending in a period, exclamation, or question mark.
        const rawSentences = data.reply.match(/[^.!?]+[.!?]*/g) || [data.reply];

        // Clean up any weird blank spaces
        const sentences = rawSentences.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0);

        // 2. Add each sentence as its own chat bubble with a staggered delay!
        sentences.forEach((sentence, index) => {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { id: Date.now() + index, sender: "bot", text: sentence },
            ]);
          }, index * 800); // 800 millisecond delay between each bubble
        });
        
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Oops, my connection dropped! Could you say that again?",
        },
      ]);
    }
  };

  const getAnimationClass = () => {
    if (emotionState === "success") return "anim-success";
    if (emotionState === "struggle") return "anim-struggle";

    if (isParent) return "";

    switch (petData.type) {
      case "dog":
        return "anim-dog";
      case "cat":
        return "anim-cat";
      case "star":
        return "anim-star";
      default:
        return "anim-bear";
    }
  };

  const currentFace = petExpressions[petData.type]?.[emotionState] || petExpressions.bear.idle;

  return (
    <div className="companion-container">
      {isOpen ? (
        <div className="companion-chat-window">
          <div
            style={{
              backgroundColor: "#EEF2FF",
              padding: "12px 16px",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold", color: "#312E81", fontSize: "1.1rem" }}>
              {petData.emoji} My Companion
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                color: "#64748B",
              }}
            >
              {"\u2715"}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              backgroundColor: "#F8FAFC",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.sender === "user" ? "#6366F1" : "#E0E7FF",
                  color: msg.sender === "user" ? "white" : "#312E81",
                  padding: "8px 14px",
                  borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                  maxWidth: "80%",
                  fontSize: "0.95rem",
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            style={{ padding: "12px", borderTop: "1px solid #E2E8F0", display: "flex", gap: "8px" }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Say hello..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid #CBD5E1",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#6366F1",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {"\u27A4"}
            </button>
          </form>
        </div>
      ) : null}

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
