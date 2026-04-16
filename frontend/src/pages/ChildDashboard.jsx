import { Link } from "react-router-dom";
import InfoCard from "../components/ui/InfoCard";
import TaskAssistantModal from "../components/ui/TaskAssistantModal";
import { useEffect, useState } from "react";
import {
  getTasks,
  getPointsBalance,
  getChildProfile,
  getChildPreferences,
  upsertChildPreferences,
} from "../services";

function ChildDashboard() {
  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(null);

  const [theme, setTheme] = useState("fun");
  const [characterStyle, setCharacterStyle] = useState("star");
  const [rewardInterest, setRewardInterest] = useState("games");
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: childData } = await getChildProfile();
      const { data: tasksData } = await getTasks();
      const { data: pointsData } = await getPointsBalance();
      const { data: preferenceData } = await getChildPreferences();

      setChild(childData);
      setTasks(tasksData || []);
      setPoints(pointsData);

      if (preferenceData) {
        setTheme(preferenceData.theme || "fun");
        setCharacterStyle(preferenceData.character_style || "star");
        setRewardInterest(preferenceData.reward_interest || "games");
      }
    }

    loadData();
  }, []);

  const handleSavePreferences = async () => {
    setPreferenceMessage("");

    const result = await upsertChildPreferences({
      child_id: child?.user_id,
      theme,
      character_style: characterStyle,
      reward_interest: rewardInterest,
    });

    if (result.error) {
      setPreferenceMessage("Failed to save preferences.");
      return;
    }

    setPreferenceMessage("Preferences saved successfully.");
  };

  if (!child) {
    return <p className="page-text">Loading dashboard...</p>;
  }

  const displayName = String(child.name || "").replace(/\s*\([^)]*\)\s*$/, "");

  const childTasks = tasks.filter(
    (task) => String(task.child_id) === String(child.user_id)
  );

  const readyTasks = childTasks
    .filter(
      (task) =>
        task.status !== "completed" &&
        Number(task.completed_steps || 0) < Number(task.total_steps || 0)
    )
    .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

  const completedTasks = childTasks
    .filter(
      (task) =>
        task.status === "completed" ||
        Number(task.completed_steps || 0) >= Number(task.total_steps || 0)
    )
    .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

  const displayedTasks =
    readyTasks.length > 0 ? readyTasks.slice(0, 3) : completedTasks.slice(0, 3);

  const ageDisplay =
    child.age ?? child.child_age ?? child.profile_age ?? "Not set";

  const summaryTextStyle = {
    margin: 0,
    fontSize: "1.08rem",
    lineHeight: 1.5,
  };

  const characterMap = {
    star: "⭐",
    rocket: "🚀",
    bear: "🧸",
    cat: "🐱",
  };

  const themeLabelMap = {
    fun: "Fun",
    space: "Space",
    animals: "Animals",
    food: "Food",
  };

  const rewardInterestLabelMap = {
    games: "Games",
    food: "Food",
    toys: "Toys",
    "screen-time": "Screen Time",
  };

  const currentCharacter = characterMap[characterStyle] || "⭐";
  const currentThemeLabel = themeLabelMap[theme] || theme;
  const currentRewardInterestLabel =
    rewardInterestLabelMap[rewardInterest] || rewardInterest;

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Child Dashboard</p>
        <h2 className="page-title">
          Hi {displayName}, what would you like to do today?
        </h2>
        <p className="page-text">
          A calm, simple space to help you move through tasks one step at a time.
        </p>
      </div>

      <div className="card-grid" style={{ alignItems: "stretch" }}>
        <InfoCard title="My Profile">
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <p style={summaryTextStyle}>
              <strong>Name:</strong> {displayName || "Not set"}
            </p>
            <p style={summaryTextStyle}>
              <strong>Age:</strong> {ageDisplay}
            </p>
            <p style={{ ...summaryTextStyle, fontWeight: 700 }}>
              ⭐ Points: {points?.points_balance ?? 0}
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Today's Tasks">
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {readyTasks.length > 0 ? (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: "2rem",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {readyTasks.length}
                </p>
                <p style={summaryTextStyle}>
                  {readyTasks.length === 1
                    ? "task ready to start"
                    : "tasks ready to start"}
                </p>
              </>
            ) : (
              <>
                <p style={{ ...summaryTextStyle, fontWeight: 700 }}>
                  🎉 No tasks right now
                </p>
                <p style={summaryTextStyle}>
                  You have completed your current tasks.
                </p>
              </>
            )}
          </div>
        </InfoCard>

        <InfoCard title="Progress">
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <p style={summaryTextStyle}>
              {readyTasks.length > 0
                ? "You have tasks ready — let’s do one small step at a time."
                : "Amazing work! You finished your current tasks."}
            </p>
            <p style={{ ...summaryTextStyle, fontWeight: 700 }}>
              {readyTasks.length > 0 ? "🌈 Keep going!" : "🏆 Great job!"}
            </p>
          </div>
        </InfoCard>
      </div>

      <div className="card-grid" style={{ marginTop: "1.5rem", alignItems: "stretch" }}>
        <InfoCard title="My Style">
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <p style={summaryTextStyle}>
              <strong>Character:</strong> {currentCharacter} {characterStyle}
            </p>
            <p style={summaryTextStyle}>
              <strong>Theme:</strong> {currentThemeLabel}
            </p>
            <p style={summaryTextStyle}>
              <strong>Reward style:</strong> {currentRewardInterestLabel}
            </p>
          </div>
        </InfoCard>

        <div className="content-card">
          <h3 style={{ marginBottom: "1rem" }}>Choose My Preferences</h3>

          <div style={{ display: "grid", gap: "1rem" }}>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: "1px solid #d8dbe8",
                fontSize: "1rem",
              }}
            >
              <option value="fun">Fun Theme</option>
              <option value="space">Space Theme</option>
              <option value="animals">Animals Theme</option>
              <option value="food">Food Theme</option>
            </select>

            <select
              value={characterStyle}
              onChange={(e) => setCharacterStyle(e.target.value)}
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: "1px solid #d8dbe8",
                fontSize: "1rem",
              }}
            >
              <option value="star">Star Character</option>
              <option value="rocket">Rocket Character</option>
              <option value="bear">Bear Character</option>
              <option value="cat">Cat Character</option>
            </select>

            <select
              value={rewardInterest}
              onChange={(e) => setRewardInterest(e.target.value)}
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: "1px solid #d8dbe8",
                fontSize: "1rem",
              }}
            >
              <option value="games">Games</option>
              <option value="food">Food</option>
              <option value="toys">Toys</option>
              <option value="screen-time">Screen Time</option>
            </select>

            {preferenceMessage && (
              <p className="page-text" style={{ margin: 0 }}>
                {preferenceMessage}
              </p>
            )}

            <div>
              <button className="primary-button" onClick={handleSavePreferences}>
                Save My Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="eyebrow">Child Dashboard</p>
          <h2 className="page-title">
            Hi {displayName}, what would you like to do today?
          </h2>
          <p className="page-text">
            A calm, simple space to help you move through tasks one step at a time.
          </p>
        </div>
        
        {/* Assistant Launch Button */}
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="primary-button"
          style={{ 
            padding: "1rem 2rem", 
            fontSize: "1.1rem", 
            borderRadius: "16px",
            boxShadow: "0 4px 6px rgba(56, 189, 248, 0.2)",
            flexShrink: 0
          }}
        >
          <span role="img" aria-label="robot" style={{ marginRight: "0.5rem" }}>🤖</span>
          Nova Help
        </button>
      </div>

      <div className="card-grid" style={{ alignItems: "stretch" }}>
        {displayedTasks.map((task) => (
          <article
            key={task.task_id}
            className="feature-card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "340px",
            }}
          >
            <div>
              <h3 style={{ marginBottom: "0.9rem" }}>
                {currentCharacter} {task.title}
              </h3>

              <p
                style={{
                  marginBottom: "1rem",
                  lineHeight: 1.5,
                }}
              >
                {task.description}
              </p>

              <p style={{ marginBottom: "0.45rem" }}>
                <strong>Steps:</strong> {task.completed_steps} / {task.total_steps}
              </p>

              {task.priority_type && (
                <p style={{ marginBottom: "0.45rem" }}>
                  <strong>Priority:</strong> {task.priority_type} ({task.priority_rank})
                </p>
              )}

              <p style={{ marginBottom: "0.45rem" }}>
                <strong>Theme:</strong> {currentThemeLabel}
              </p>

              {task.status === "completed" && (
                <p style={{ marginBottom: 0, fontWeight: 700 }}>
                  ✅ Completed
                </p>
              )}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <Link to={`/tasks/${task.task_id}`} className="primary-button small-button">
                Open Task
              </Link>
            </div>
          </article>
        ))}
      </div>
      <TaskAssistantModal 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
    </section>
  );
}

export default ChildDashboard;