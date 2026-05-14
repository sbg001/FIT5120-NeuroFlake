import { useEffect, useState } from "react";

const EMOTION_TO_FRICTION = {
  Frustration: { label: "High Friction", tone: "high" },
  Overwhelm: { label: "High Friction", tone: "high" },
  Sadness: { label: "Needs Support", tone: "medium" },
  Fatigue: { label: "Needs Support", tone: "medium" },
  Calm: { label: "Neutral", tone: "neutral" },
  Joy: { label: "Smooth", tone: "smooth" },
  Excitement: { label: "Smooth", tone: "smooth" },
};

const frictionColors = {
  high: { background: "#fde8e8", color: "#c0392b" },
  medium: { background: "#fef3cd", color: "#856404" },
  neutral: { background: "#f0f0f0", color: "#555" },
  smooth: { background: "#e6f9f0", color: "#1a7a4a" },
};

function buildMoodPulse(logs) {
  if (!logs.length) return null;
  const counts = {};
  logs.forEach((log) => {
    counts[log.emotion] = (counts[log.emotion] || 0) + 1;
  });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const hasHighFriction = logs.some(
    (l) => l.emotion === "Frustration" || l.emotion === "Overwhelm"
  );
  const taskContexts = [...new Set(logs.filter((l) => l.task_context).map((l) => l.task_context))];
  const frictionTasks = logs
    .filter((l) => l.emotion === "Frustration" || l.emotion === "Overwhelm")
    .map((l) => l.task_context)
    .filter(Boolean);

  if (hasHighFriction && frictionTasks.length) {
    return `Mostly ${dominant}, but experiencing friction during ${frictionTasks[0]}.`;
  }
  if (dominant === "Joy" || dominant === "Excitement") {
    return `Feeling ${dominant.toLowerCase()} today — a great session overall.`;
  }
  return `Primarily ${dominant} throughout today's session.`;
}

function buildTaskFriction(logs) {
  const taskMap = {};
  logs.forEach((log) => {
    const key = log.task_context || "General";
    if (!taskMap[key]) taskMap[key] = { task: key, emotions: [] };
    taskMap[key].emotions.push(log.emotion);
  });

  return Object.values(taskMap).map(({ task, emotions }) => {
    const dominant = emotions.sort(
      (a, b) =>
        emotions.filter((e) => e === b).length -
        emotions.filter((e) => e === a).length
    )[0];
    return { task, emotion: dominant, ...EMOTION_TO_FRICTION[dominant] };
  });
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmotionInsights() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    function readLogs() {
        try {
        const raw = localStorage.getItem("neuroflake_emotion_log");
        const parsed = raw ? JSON.parse(raw) : [];
        const today = new Date().toDateString();
        setLogs(parsed.filter((e) => new Date(e.timestamp).toDateString() === today));
        } catch {
        setLogs([]);
        }
    }

    readLogs(); // Read on mount

    // Re-read when the parent tab is focused or storage changes
    window.addEventListener("focus", readLogs);
    window.addEventListener("storage", readLogs);

    return () => {
        window.removeEventListener("focus", readLogs);
        window.removeEventListener("storage", readLogs);
    };
    }, []);

  const moodPulse = buildMoodPulse(logs);
  const taskFriction = buildTaskFriction(logs);
  const needsSupport = logs.filter(
    (l) => l.emotion === "Frustration" || l.emotion === "Overwhelm" || l.emotion === "Sadness"
  );

  if (!logs.length) {
    return (
      <div className="parent-dashboard__collection-card" style={{ padding: "1.5rem" }}>
        <p className="eyebrow">Emotional Insights</p>
        <h3>No activity yet today</h3>
        <p className="page-text">
          Emotional data will appear here once your child starts interacting with their companion.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
      <div>
        <p className="eyebrow">Emotional Insights</p>
        <p className="page-text">Understand how your child is feeling today based on their companion interactions.</p>
      </div>

      {/* Daily Mood Pulse */}
      {moodPulse && (
        <div style={{
          background: "#eef1fb",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}>
          <span style={{ fontSize: "1.4rem" }}>🌤️</span>
          <div>
            <p style={{ fontWeight: 600, color: "#3b5bdb", marginBottom: "0.25rem" }}>Daily Mood Pulse</p>
            <p style={{ fontWeight: 700, color: "#1e3a8a", margin: 0 }}>{moodPulse}</p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Task Friction */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span>🚦</span>
            <strong>Task Friction</strong>
          </div>
          <p className="page-text" style={{ marginBottom: "1rem" }}>
            Tasks causing the most emotional resistance today.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {taskFriction.map(({ task, emotion, label, tone }) => {
              const colors = frictionColors[tone];
              return (
                <div key={task} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{task}</p>
                    <p style={{ fontSize: "0.8rem", color: "#666", margin: 0 }}>Reported: {emotion}</p>
                  </div>
                  <span style={{
                    background: colors.background,
                    color: colors.color,
                    padding: "0.2rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Support */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span>💬</span>
            <strong>Needs Support</strong>
          </div>
          <p className="page-text" style={{ marginBottom: "1rem" }}>
            Recent messages where your child expressed frustration or overwhelm.
          </p>
          {needsSupport.length === 0 ? (
            <p className="page-text">No distress signals detected today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {needsSupport.map((log, i) => (
                <div key={i} style={{ borderLeft: "3px solid #f87171", paddingLeft: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "#888", margin: "0 0 0.2rem" }}>
                    {formatTime(log.timestamp)}{log.task_context ? ` · While doing: ${log.task_context}` : ""}
                  </p>
                  <p style={{ fontStyle: "italic", margin: 0 }}>"{log.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmotionInsights;