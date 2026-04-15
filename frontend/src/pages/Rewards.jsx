import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getPointsBalance,
  getLatestRewardSummary,
  getRewardTransactions,
  getRewardMilestoneMessage,
  getEncouragingMessage,
  getSuggestedRewards,
  getParentApprovedRewards,
  getTasks,
  getChildProfile,
  getChildPreferences,
} from "../services";

function Rewards() {
  const navigate = useNavigate();
  const location = useLocation();

  const showCelebration = location.state?.showCelebration === true;

  const [pointsData, setPointsData] = useState(null);
  const [latestRewardSummary, setLatestRewardSummary] = useState(null);
  const [rewardTransactions, setRewardTransactions] = useState([]);
  const [suggestedRewards, setSuggestedRewards] = useState([]);
  const [parentRewards, setParentRewards] = useState([]);
  const [nextTaskId, setNextTaskId] = useState(null);
  const [childPreferences, setChildPreferences] = useState(null);

  useEffect(() => {
    async function loadRewardsData() {
      const pointsResult = await getPointsBalance();
      const latestSummaryResult = await getLatestRewardSummary();
      const transactionsResult = await getRewardTransactions();
      const parentRewardsResult = await getParentApprovedRewards();
      const childResult = await getChildProfile();
      const preferencesResult = await getChildPreferences();
      const tasksResult = await getTasks();

      const childData = childResult.data;
      const allTasks = tasksResult.data || [];
      const latestTaskId = latestSummaryResult.data?.task_id;

      const childTasks = allTasks
        .filter((task) => String(task.child_id) === String(childData?.user_id))
        .filter((task) => String(task.task_id) !== String(latestTaskId))
        .filter(
          (task) =>
            task.status !== "completed" &&
            Number(task.completed_steps || 0) < Number(task.total_steps || 0)
        )
        .sort((a, b) => {
          const rankDiff = (b.priority_rank || 0) - (a.priority_rank || 0);
          if (rankDiff !== 0) return rankDiff;
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        });

      setPointsData(pointsResult.data);
      setLatestRewardSummary(latestSummaryResult.data);
      setRewardTransactions(transactionsResult.data || []);
      setSuggestedRewards(getSuggestedRewards());
      setParentRewards(parentRewardsResult.data || []);
      setChildPreferences(preferencesResult.data || null);
      setNextTaskId(childTasks[0]?.task_id || null);
    }

    loadRewardsData();
  }, []);

  const handleStartAnotherTask = () => {
    if (nextTaskId) {
      navigate(`/tasks/${nextTaskId}`);
      return;
    }

    navigate("/child");
  };

  const handleGoToMyTasks = () => {
    navigate("/child");
  };

  if (!pointsData || !latestRewardSummary) {
    return (
      <section className="page-section">
        <p>Loading rewards...</p>
      </section>
    );
  }

  const pointsBalance = pointsData.points_balance ?? 0;
  const milestoneMessage = getRewardMilestoneMessage(pointsBalance);
  const encouragingMessage = getEncouragingMessage(
    pointsBalance,
    rewardTransactions.length
  );
  const recentTransactions = rewardTransactions.slice(0, 3);

  const theme = childPreferences?.theme || "fun";
  const characterStyle = childPreferences?.character_style || "star";
  const rewardInterest = childPreferences?.reward_interest || "games";

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

  const getRewardMatchScore = (reward) => {
    let score = 0;

    if (String(reward.theme || "").toLowerCase() === String(theme).toLowerCase()) {
      score += 3;
    }

    const rewardText = `${reward.title || ""} ${reward.theme || ""}`.toLowerCase();

    if (rewardInterest === "food" && /food|dessert|pizza|snack|treat|ice cream|cake/.test(rewardText)) {
      score += 2;
    }

    if (rewardInterest === "games" && /game|play|fun/.test(rewardText)) {
      score += 2;
    }

    if (rewardInterest === "toys" && /toy|sticker|surprise|plush|small toy/.test(rewardText)) {
      score += 2;
    }

    if (rewardInterest === "screen-time" && /screen|ipad|tablet|movie|video/.test(rewardText)) {
      score += 2;
    }

    return score;
  };

  const personalizedSuggestedRewards = [...suggestedRewards].sort(
    (a, b) => getRewardMatchScore(b) - getRewardMatchScore(a)
  );

  const personalizedParentRewards = [...parentRewards].sort(
    (a, b) => getRewardMatchScore(b) - getRewardMatchScore(a)
  );

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Rewards</p>
        <h2 className="page-title">
          {showCelebration ? "You did it!" : "My Rewards"}
        </h2>
        <p className="page-text">
          {showCelebration
            ? "Every completed task is a step forward. Let’s celebrate your progress."
            : "See your points, rewards, and encouraging progress all in one place."}
        </p>
      </div>

      {showCelebration && (
        <div
          className="hero-card"
          style={{
            textAlign: "center",
            padding: "2rem",
            border: "2px solid #f7d98b",
            background:
              "linear-gradient(180deg, rgba(255,248,225,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <p style={{ fontSize: "3rem", margin: "0 0 0.5rem 0" }}>🎉</p>
          <h3 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
            Great job, superstar!
          </h3>
          <p
            className="page-text"
            style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
          >
            {latestRewardSummary.celebration_message ||
              "Amazing work! You completed your task."}
          </p>
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              margin: "0 0 1rem 0",
            }}
          >
            🏆 +{latestRewardSummary.points_earned} points earned
          </p>

          {latestRewardSummary.task_title && (
            <p className="page-text" style={{ marginBottom: "1rem" }}>
              You finished <strong>{latestRewardSummary.task_title}</strong>.
            </p>
          )}

          <div
            className="button-row"
            style={{ justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}
          >
            <button className="primary-button" onClick={handleGoToMyTasks}>
              Go to My Tasks
            </button>
            <button className="secondary-button" onClick={handleStartAnotherTask}>
              Start Another Task
            </button>
          </div>
        </div>
      )}

      <div
        className="card-grid"
        style={{
          marginTop: "1.5rem",
          alignItems: "stretch",
        }}
      >
        <div className="content-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>⭐</p>
          <h3 style={{ marginBottom: "0.5rem" }}>My Points</h3>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {pointsBalance}
          </p>
        </div>

        <div className="content-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>
            {currentCharacter}
          </p>
          <h3 style={{ marginBottom: "0.5rem" }}>My Style</h3>
          <p className="page-text" style={{ margin: 0 }}>
            Theme: {currentThemeLabel}
          </p>
          <p className="page-text" style={{ margin: "0.35rem 0 0 0" }}>
            Reward style: {currentRewardInterestLabel}
          </p>
        </div>

        <div className="content-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>🏅</p>
          <h3 style={{ marginBottom: "0.5rem" }}>Milestone</h3>
          <p className="page-text" style={{ margin: 0 }}>
            {milestoneMessage}
          </p>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Recent reward activity</h3>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <div
              key={
                transaction.transaction_id ||
                `${transaction.task_id}-${transaction.created_at}`
              }
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "14px",
                background: "#f8faff",
                border: "1px solid #d8dbe8",
                marginBottom: "0.75rem",
              }}
            >
              <p style={{ margin: 0 }}>
                🎁 <strong>+{transaction.points_earned} points</strong>
                {transaction.task_title
                  ? ` from ${transaction.task_title}`
                  : " from a completed task"}
              </p>
            </div>
          ))
        ) : (
          <p>No reward activity yet.</p>
        )}
      </div>

      <div className="content-card" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>
          Reward ideas picked for your style
        </h3>
        <div className="card-grid" style={{ alignItems: "stretch" }}>
          {personalizedSuggestedRewards.map((reward) => {
            const isBestMatch = getRewardMatchScore(reward) > 0;

            return (
              <div
                key={reward.id}
                className="feature-card"
                style={{
                  textAlign: "center",
                }}
              >
                {isBestMatch && (
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {currentCharacter} Best match for you
                  </p>
                )}

                <p style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                  {reward.emoji}
                </p>
                <h4 style={{ marginBottom: "0.5rem" }}>{reward.title}</h4>
                <p style={{ margin: "0.25rem 0" }}>Cost: {reward.cost} points</p>
                <p style={{ margin: "0.25rem 0" }}>Theme: {reward.theme}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Parent-picked rewards</h3>
        <div className="card-grid" style={{ alignItems: "stretch" }}>
          {personalizedParentRewards.map((reward) => {
            const isBestMatch = getRewardMatchScore(reward) > 0;

            return (
              <div
                key={reward.id}
                className="feature-card"
                style={{
                  textAlign: "center",
                }}
              >
                {isBestMatch && (
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {currentCharacter} Best match for you
                  </p>
                )}

                <p style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                  {reward.emoji}
                </p>
                <h4 style={{ marginBottom: "0.5rem" }}>{reward.title}</h4>
                <p style={{ margin: "0.25rem 0" }}>Cost: {reward.cost} points</p>
                <p style={{ margin: "0.25rem 0" }}>Theme: {reward.theme}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Encouragement</h3>
        <p className="page-text" style={{ margin: 0 }}>
          {encouragingMessage}
        </p>
      </div>
    </section>
  );
}

export default Rewards;