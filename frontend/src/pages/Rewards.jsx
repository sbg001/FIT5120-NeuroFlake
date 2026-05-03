import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import {
  claimReward,
  getPointsBalance,
  getRewardTransactions,
  getRewardMilestoneMessage,
  getEncouragingMessage,
  getParentApprovedRewards,
  getTasks,
  getChildProfile,
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

  const [childId, setChildId] = useState("");
  const [pointsData, setPointsData] = useState(null);
  const [latestRewardSummary, setLatestRewardSummary] = useState(null);
  const [rewardTransactions, setRewardTransactions] = useState([]);
  const [parentRewards, setParentRewards] = useState([]);
  const [nextTaskId, setNextTaskId] = useState(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(showCelebration);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimingRewardId, setClaimingRewardId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const buildLatestRewardSummary = (pointsBalance, transactions) => {
    const safePointsBalance = pointsBalance ?? 0;
    const latestTransaction = (transactions || [])[0];

    if (!latestTransaction) {
      return {
        task_id: null,
        task_title: "No reward activity yet",
        points_earned: 0,
        steps_completed: 0,
        updated_points_balance: safePointsBalance,
        celebration_message: "Complete a task to start earning points.",
      };
    }

    const isClaim =
      latestTransaction.transaction_type === "claim" ||
      latestTransaction.transaction_type === "redeem";

    return {
      task_id: latestTransaction.task_id,
      task_title:
        latestTransaction.reward_title ||
        latestTransaction.task_title ||
        (isClaim ? "Reward claimed" : "Task reward"),
      points_earned: latestTransaction.points_earned || 0,
      steps_completed: latestTransaction.steps_completed || 0,
      updated_points_balance: safePointsBalance,
      celebration_message: isClaim
        ? "You used your points for a reward."
        : "Amazing work! You earned more points today.",
    };
  };

  useEffect(() => {
    async function loadRewardsData() {
      setLoadError("");
      const childResult = await getChildProfile();
      const childData = childResult.data;
      const resolvedChildId = String(childData?.user_id || "");

      setChildId(resolvedChildId);

      if (!resolvedChildId) {
        const fallbackSummary = buildLatestRewardSummary(0, []);
        setPointsData({ child_id: null, points_balance: 0, updated_at: null });
        setLatestRewardSummary(fallbackSummary);
        setRewardTransactions([]);
        setParentRewards([]);
        setNextTaskId(null);
        setLoadError(
          childResult.error || "We could not load the rewards page right now."
        );
        return;
      }

      const [pointsResult, transactionsResult, parentRewardsResult, tasksResult] =
        await Promise.all([
          getPointsBalance(resolvedChildId),
          getRewardTransactions(resolvedChildId),
          getParentApprovedRewards(resolvedChildId),
          getTasks(resolvedChildId),
        ]);

      const pointsBalance = pointsResult.data?.points_balance ?? 0;
      const transactions = transactionsResult.data || [];
      const latestSummary = buildLatestRewardSummary(pointsBalance, transactions);

      const childTasks = (tasksResult.data || [])
        .filter((task) => String(task.task_id) !== String(latestSummary.task_id))
        .filter(
          (task) =>
            task.status !== "completed" &&
            Number(task.completed_steps || 0) < Number(task.total_steps || 0)
        );

      setPointsData(pointsResult.data);
      setLatestRewardSummary(latestSummary);
      setRewardTransactions(transactions);
      setParentRewards(parentRewardsResult.data || []);
      setNextTaskId(childTasks[0]?.task_id || null);
      setLoadError(
        childResult.error ||
          pointsResult.error ||
          transactionsResult.error ||
          parentRewardsResult.error ||
          tasksResult.error ||
          ""
      );
    }

    loadRewardsData();
  }, []);

  const dismissCelebration = () => {
    setIsCelebrationOpen(false);
    setCelebrationDismissed(true);
    navigate(location.pathname, { replace: true, state: {} });
  };

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
  const recentTransactions = rewardTransactions.slice(0, 5);
  const latestPointsEarned = latestRewardSummary?.points_earned ?? 0;
  const updatedPointsBalance =
    latestRewardSummary?.updated_points_balance ?? pointsBalance;
  const nextMilestoneTarget =
    pointsBalance >= 300 ? 400 : pointsBalance >= 200 ? 300 : pointsBalance >= 100 ? 200 : 100;
  const pointsToNextMilestone = Math.max(nextMilestoneTarget - pointsBalance, 0);

  const handleClaimReward = async (reward) => {
    setClaimMessage("");
    setClaimError("");

    if (!childId) {
      setClaimError("Your reward profile is not ready yet. Please try again.");
      return;
    }

    if (!reward?.id) {
      setClaimError("This reward is not available right now.");
      return;
    }

    if (pointsBalance < Number(reward.cost || 0)) {
      setClaimError("You do not have enough points for this reward yet.");
      return;
    }

    setClaimingRewardId(String(reward.id));

    const result = await claimReward({
      child_id: childId,
      reward_id: reward.id,
    });

    if (result.error) {
      setClaimError(result.error);
      setClaimingRewardId("");
      return;
    }

    if (result.data?.points) {
      setPointsData(result.data.points);
    }

    setParentRewards((prevRewards) =>
      prevRewards.filter((availableReward) => String(availableReward.id) !== String(reward.id))
    );

    if (result.data?.transaction) {
      setRewardTransactions((prev) => {
        const updatedTransactions = [result.data.transaction, ...prev];
        const updatedPointsBalance =
          result.data?.points?.points_balance ?? pointsBalance;
        setLatestRewardSummary(
          buildLatestRewardSummary(updatedPointsBalance, updatedTransactions)
        );
        return updatedTransactions;
      });
    } else if (result.data?.points) {
      setLatestRewardSummary((prev) => ({
        ...(prev || buildLatestRewardSummary(result.data.points.points_balance, [])),
        updated_points_balance: result.data.points.points_balance,
      }));
    }

    setClaimMessage(result.data?.message || "Reward claimed successfully.");
    setClaimingRewardId("");
  };

  return (
    <section className="page-section rewards-experience">
      <PageHeader
        eyebrow="Rewards"
        title={showCelebration ? "You did it!" : "My Rewards"}
        description={
          showCelebration
            ? "Every completed task is a step forward. Let's celebrate your progress."
            : "See your points, available rewards, and recent progress in one place."
        }
      />

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      {showCelebration && !celebrationDismissed ? (
        <Card className="reward-celebration-banner" variant="glow">
          <div className="reward-celebration-banner__stars" aria-hidden="true">
            <span>★</span>
            <span>✦</span>
            <span>★</span>
          </div>
          <div className="reward-celebration-banner__copy">
            <Badge tone="warm">Well done</Badge>
            <h3>Great job!</h3>
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
      ) : null}

      <div className="reward-overview-grid reward-overview-grid--simple">
        <Card className="reward-points-card" variant="glow">
          <div className="reward-points-card__content">
            <div>
              <p className="eyebrow">Reward Points</p>
              <h3>My points</h3>
            </div>
            <div className="reward-points-card__count">{pointsBalance}</div>
            <p className="page-text">
              Each completed task adds points you can use for rewards.
            </p>
            <div className="reward-points-card__footer">
              <Badge tone="warm">+{latestPointsEarned} latest points</Badge>
              <span>{pointsToNextMilestone} to next milestone</span>
            </div>
          </div>
          <div className="reward-points-card__sparkles" aria-hidden="true">
            <span>★</span>
            <span>✦</span>
            <span>★</span>
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

      <Card className="reward-shelf-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow">Available Rewards</p>
            <h3>Rewards you can choose from</h3>
          </div>
          <Badge tone="mint">{parentRewards.length} options</Badge>
        </div>
        {parentRewards.length > 0 ? (
          <div className="reward-shelf-grid">
            {parentRewards.map((reward) => (
              <Card
                key={reward.id}
                className="reward-item-card reward-item-card--simple"
                variant="soft"
              >
                <h4>{reward.title}</h4>
                <div className="reward-item-card__meta">
                  <span>{reward.cost} points</span>
                </div>
                <Button
                  onClick={() => handleClaimReward(reward)}
                  disabled={
                    Boolean(claimingRewardId) ||
                    pointsBalance < Number(reward.cost || 0)
                  }
                >
                  {claimingRewardId === String(reward.id) ? "Claiming..." : "Claim Reward"}
                </Button>
                {pointsBalance < Number(reward.cost || 0) ? (
                  <p className="reward-helper-text">
                    You need {Number(reward.cost || 0) - pointsBalance} more points.
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <p className="page-text">No rewards have been added yet.</p>
        )}
        {claimError ? <p className="parent-dashboard__message">{claimError}</p> : null}
        {claimMessage ? <p className="reward-success-message">{claimMessage}</p> : null}
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
                {transaction.transaction_type === "claim" ||
                transaction.transaction_type === "redeem"
                  ? "🎁"
                  : "✓"}
              </div>
              <p>
                {transaction.transaction_type === "claim" ||
                transaction.transaction_type === "redeem" ? (
                  <>
                    <strong>{Math.abs(transaction.points_earned)} points used</strong>
                    {transaction.reward_title
                      ? ` for ${transaction.reward_title}`
                      : " for a reward"}
                  </>
                ) : (
                  <>
                    <strong>+{transaction.points_earned} points</strong>
                    {transaction.task_title
                      ? ` from ${transaction.task_title}`
                      : " from a completed task"}
                  </>
                )}
              </p>
            </div>
          ))
        ) : (
          <p className="page-text">No reward activity yet.</p>
        )}
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
            onClick={dismissCelebration}
          />
          <Card className="reward-celebration-modal__panel" variant="glow">
            <button
              type="button"
              className="reward-celebration-modal__close"
              onClick={dismissCelebration}
              aria-label="Close celebration"
            >
              {"\u00D7"}
            </button>

            <div className="reward-celebration-modal__confetti" aria-hidden="true">
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--1">
                {"\u2605"}
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--2">
                {"\u2726"}
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--3">
                {"\u2605"}
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--4">
                {"\u2726"}
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--5">
                {"\u2605"}
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
                  <span>points available</span>
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
