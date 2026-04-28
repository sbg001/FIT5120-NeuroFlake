import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
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
  const celebrationMessages = [
    "Great effort!",
    "You completed a step!",
    "Your focus is growing!",
  ];

  const [pointsData, setPointsData] = useState(null);
  const [latestRewardSummary, setLatestRewardSummary] = useState(null);
  const [rewardTransactions, setRewardTransactions] = useState([]);
  const [suggestedRewards, setSuggestedRewards] = useState([]);
  const [parentRewards, setParentRewards] = useState([]);
  const [nextTaskId, setNextTaskId] = useState(null);
  const [childPreferences, setChildPreferences] = useState(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  useEffect(() => {
    async function loadRewardsData() {
      const childResult = await getChildProfile();
      const childData = childResult.data;
      const pointsResult = await getPointsBalance(childData?.user_id);
      const latestSummaryResult = await getLatestRewardSummary(childData?.user_id);
      const transactionsResult = await getRewardTransactions(childData?.user_id);
      const parentRewardsResult = await getParentApprovedRewards();
      const preferencesResult = await getChildPreferences();
      const tasksResult = await getTasks();

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

  useEffect(() => {
    setIsCelebrationOpen(showCelebration);
  }, [showCelebration]);

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
  const latestPointsEarned = latestRewardSummary?.points_earned ?? 0;
  const latestStepsCompleted = latestRewardSummary?.steps_completed ?? 0;
  const updatedPointsBalance =
    latestRewardSummary?.updated_points_balance ?? pointsBalance;
  const nextMilestoneTarget =
    pointsBalance >= 300 ? 400 : pointsBalance >= 200 ? 300 : pointsBalance >= 100 ? 200 : 100;
  const pointsToNextMilestone = Math.max(nextMilestoneTarget - pointsBalance, 0);

  const achievementBadges = [
    {
      id: "spark-points",
      emoji: "⭐",
      title: "Spark Points",
      text: `${pointsBalance} points shining in your jar`,
      tone: "warm",
    },
    {
      id: "step-finisher",
      emoji: "🏅",
      title: "Step Finisher",
      text:
        latestStepsCompleted > 0
          ? `${latestStepsCompleted} calm step${latestStepsCompleted === 1 ? "" : "s"} completed`
          : "Each finished step adds to your progress",
      tone: "mint",
    },
    {
      id: "focus-grower",
      emoji: currentCharacter,
      title: "Focus Grower",
      text:
        pointsToNextMilestone > 0
          ? `${pointsToNextMilestone} more points to your next milestone`
          : "A new milestone is ready to celebrate",
      tone: "sky",
    },
  ];

  const getRewardMatchScore = (reward) => {
    let score = 0;

    if (String(reward.theme || "").toLowerCase() === String(theme).toLowerCase()) {
      score += 3;
    }

    const rewardText = `${reward.title || ""} ${reward.theme || ""}`.toLowerCase();

    if (
      rewardInterest === "food" &&
      /food|dessert|pizza|snack|treat|ice cream|cake/.test(rewardText)
    ) {
      score += 2;
    }

    if (rewardInterest === "games" && /game|play|fun/.test(rewardText)) {
      score += 2;
    }

    if (
      rewardInterest === "toys" &&
      /toy|sticker|surprise|plush|small toy/.test(rewardText)
    ) {
      score += 2;
    }

    if (
      rewardInterest === "screen-time" &&
      /screen|ipad|tablet|movie|video/.test(rewardText)
    ) {
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
    <section className="page-section rewards-experience">
      <PageHeader
        eyebrow="Rewards"
        title={showCelebration ? "You did it!" : "My Rewards"}
        description={
          showCelebration
            ? "Every completed task is a step forward. Let's celebrate your progress."
            : "See your points, rewards, and encouraging progress all in one place."
        }
      />

      {showCelebration && (
        <Card className="reward-celebration-banner" variant="glow">
          <div className="reward-celebration-banner__stars" aria-hidden="true">
            <span>⭐</span>
            <span>✨</span>
            <span>⭐</span>
          </div>
          <div className="reward-celebration-banner__copy">
            <Badge tone="warm">Mission complete</Badge>
            <h3>Great job, superstar!</h3>
            <p className="page-text">
              {latestRewardSummary.celebration_message ||
                "Amazing work! You completed your task."}
            </p>
          </div>
          <div className="reward-celebration-banner__score">
            <strong>+{latestPointsEarned}</strong>
            <span>points earned</span>
          </div>
        </Card>
      )}

      <div className="reward-overview-grid">
        <Card className="reward-points-card" variant="glow">
          <div className="reward-points-card__content">
            <div>
              <p className="eyebrow">Reward Points</p>
              <h3>My point jar</h3>
            </div>
            <div className="reward-points-card__count">{pointsBalance}</div>
            <p className="page-text">
              Every finished step adds something good to your day.
            </p>
            <div className="reward-points-card__footer">
              <Badge tone="warm">+{latestPointsEarned} latest points</Badge>
              <span>{pointsToNextMilestone} to next milestone</span>
            </div>
          </div>
          <div className="reward-points-card__sparkles" aria-hidden="true">
            <span>⭐</span>
            <span>✨</span>
            <span>🌟</span>
          </div>
        </Card>

        <Card className="reward-style-card" variant="soft">
          <div className="reward-style-card__icon" aria-hidden="true">
            {currentCharacter}
          </div>
          <div className="reward-style-card__copy">
            <p className="eyebrow">My Style</p>
            <h3>{currentThemeLabel} world</h3>
            <p className="page-text">Reward style: {currentRewardInterestLabel}</p>
          </div>
        </Card>

        <Card className="reward-milestone-card" variant="soft">
          <div className="reward-milestone-card__icon" aria-hidden="true">
            🏆
          </div>
          <div className="reward-milestone-card__copy">
            <p className="eyebrow">Milestone</p>
            <h3>Keep going</h3>
            <p className="page-text">{milestoneMessage}</p>
          </div>
        </Card>
      </div>

      <Card className="reward-badges-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Achievement Badges</p>
            <h3>Small wins worth noticing</h3>
          </div>
          <Badge tone="mint">Progress celebration</Badge>
        </div>
        <div className="reward-badges-grid">
          {achievementBadges.map((badge) => (
            <div key={badge.id} className="reward-badge-tile">
              <Badge tone={badge.tone}>{badge.title}</Badge>
              <div className="reward-badge-tile__icon" aria-hidden="true">
                {badge.emoji}
              </div>
              <p>{badge.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="reward-activity-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Recent Reward Activity</p>
            <h3>Progress you can look back on</h3>
          </div>
        </div>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <div
              key={
                transaction.transaction_id ||
                `${transaction.task_id}-${transaction.created_at}`
              }
              className="reward-activity-item"
            >
              <div className="reward-activity-item__icon" aria-hidden="true">
                🎁
              </div>
              <p>
                <strong>+{transaction.points_earned} points</strong>
                {transaction.task_title
                  ? ` from ${transaction.task_title}`
                  : " from a completed task"}
              </p>
            </div>
          ))
        ) : (
          <p>No reward activity yet.</p>
        )}
      </Card>

      <Card className="reward-shelf-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Reward Ideas</p>
            <h3>Picked for your style</h3>
          </div>
        </div>
        <div className="reward-shelf-grid">
          {personalizedSuggestedRewards.map((reward) => {
            const isBestMatch = getRewardMatchScore(reward) > 0;

            return (
              <Card key={reward.id} className="reward-item-card" variant="soft">
                {isBestMatch ? (
                  <p className="reward-item-card__match">
                    {currentCharacter} Best match for you
                  </p>
                ) : null}

                <div className="reward-item-card__emoji" aria-hidden="true">
                  {reward.emoji}
                </div>
                <h4>{reward.title}</h4>
                <div className="reward-item-card__meta">
                  <span>{reward.cost} points</span>
                  <span>{reward.theme}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="reward-shelf-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Parent Picks</p>
            <h3>Rewards chosen with care</h3>
          </div>
        </div>
        <div className="reward-shelf-grid">
          {personalizedParentRewards.map((reward) => {
            const isBestMatch = getRewardMatchScore(reward) > 0;

            return (
              <Card key={reward.id} className="reward-item-card" variant="soft">
                {isBestMatch ? (
                  <p className="reward-item-card__match">
                    {currentCharacter} Best match for you
                  </p>
                ) : null}

                <div className="reward-item-card__emoji" aria-hidden="true">
                  {reward.emoji}
                </div>
                <h4>{reward.title}</h4>
                <div className="reward-item-card__meta">
                  <span>{reward.cost} points</span>
                  <span>{reward.theme}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="reward-encouragement-card" variant="soft">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Encouragement</p>
            <h3>Kind words for your progress</h3>
          </div>
        </div>
        <div className="reward-encouragement-list">
          {celebrationMessages.map((message) => (
            <div key={message} className="reward-encouragement-pill">
              {message}
            </div>
          ))}
        </div>
        <p className="page-text">{encouragingMessage}</p>
      </Card>

      {isCelebrationOpen ? (
        <div
          className="reward-celebration-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reward-celebration-title"
        >
          <div
            className="reward-celebration-modal__backdrop"
            onClick={() => setIsCelebrationOpen(false)}
          />
          <Card className="reward-celebration-modal__panel" variant="glow">
            <button
              type="button"
              className="reward-celebration-modal__close"
              onClick={() => setIsCelebrationOpen(false)}
              aria-label="Close celebration"
            >
              ×
            </button>

            <div className="reward-celebration-modal__confetti" aria-hidden="true">
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--1">
                ⭐
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--2">
                ✨
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--3">
                ⭐
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--4">
                ✨
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--5">
                🌟
              </span>
            </div>

            <div className="reward-celebration-modal__content">
              <Badge tone="warm">Celebration moment</Badge>
              <div className="reward-celebration-modal__hero" aria-hidden="true">
                🎉
              </div>
              <h3 id="reward-celebration-title">Great effort!</h3>
              <p className="page-text">
                {latestRewardSummary.celebration_message ||
                  "Amazing work! You completed your task."}
              </p>

              {latestRewardSummary.task_title ? (
                <p className="reward-celebration-modal__task">
                  You finished <strong>{latestRewardSummary.task_title}</strong>.
                </p>
              ) : null}

              <div className="reward-celebration-modal__stats">
                <div>
                  <strong>+{latestPointsEarned}</strong>
                  <span>points earned</span>
                </div>
                <div>
                  <strong>{updatedPointsBalance}</strong>
                  <span>points in your jar</span>
                </div>
              </div>

              <div className="reward-celebration-modal__messages">
                {celebrationMessages.map((message) => (
                  <span key={message}>{message}</span>
                ))}
              </div>

              <div className="reward-celebration-modal__actions">
                <Button onClick={handleGoToMyTasks}>Go to My Tasks</Button>
                <Button variant="secondary" onClick={handleStartAnotherTask}>
                  Start Another Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

export default Rewards;
