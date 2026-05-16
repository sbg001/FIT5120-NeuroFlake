import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import OpenMojiIcon from "../components/ui/OpenMojiIcon";
import PageHeader from "../components/ui/PageHeader";
import {
  claimReward,
  getPointsBalance,
  getRewardTransactions,
  getRewardMilestoneMessage,
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
    "Quest complete!",
    "Stars added!",
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
        task_title: "No star activity yet",
        points_earned: 0,
        steps_completed: 0,
        updated_points_balance: safePointsBalance,
        celebration_message: "Finish a quest to earn stars.",
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
        (isClaim ? "Reward chosen" : "Quest reward"),
      points_earned: latestTransaction.points_earned || 0,
      steps_completed: latestTransaction.steps_completed || 0,
      updated_points_balance: safePointsBalance,
      celebration_message: isClaim
        ? "You used stars for a reward."
        : "You earned more quest stars.",
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
  const recentTransactions = rewardTransactions.slice(0, 5);
  const latestPointsEarned = latestRewardSummary?.points_earned ?? 0;
  const updatedPointsBalance =
    latestRewardSummary?.updated_points_balance ?? pointsBalance;
  const nextMilestoneTarget =
    pointsBalance >= 300 ? 400 : pointsBalance >= 200 ? 300 : pointsBalance >= 100 ? 200 : 100;
  const pointsToNextMilestone = Math.max(nextMilestoneTarget - pointsBalance, 0);
  const milestoneProgress = Math.min(
    100,
    Math.round((pointsBalance / Math.max(nextMilestoneTarget, 1)) * 100)
  );
  const treasureStarCount = Math.min(Math.max(pointsBalance, 4), 10);

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
      setClaimError("You need more stars for this reward.");
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

    setClaimMessage(result.data?.message || "Reward chosen.");
    setClaimingRewardId("");
  };

  return (
    <section className="page-section rewards-experience">
      <PageHeader
        eyebrow="Treasure"
        title={showCelebration ? "You did it!" : "Treasure Jar"}
        description={
          showCelebration
            ? "Your quest stars are ready."
            : "Collect quest stars and choose rewards."
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
            <span><OpenMojiIcon name="star" /></span>
            <span><OpenMojiIcon name="sparkles" /></span>
            <span><OpenMojiIcon name="star" /></span>
          </div>
          <div className="reward-celebration-banner__copy">
            <Badge tone="warm" className="reward-openmoji-badge">
              <span className="reward-inline-openmoji" aria-hidden="true">
                <OpenMojiIcon name="check" />
              </span>
              <span>Well done</span>
            </Badge>
            <h3>Quest complete</h3>
            <p className="page-text">
              {latestRewardSummary.celebration_message || "You earned more quest stars."}
            </p>
          </div>
          <div className="reward-celebration-banner__score">
            <strong>+{latestPointsEarned}</strong>
            <span>quest stars</span>
          </div>
        </Card>
      ) : null}

      <div className="reward-overview-grid reward-overview-grid--simple">
        <Card className="reward-points-card reward-points-card--treasure" variant="glow">
          <div className="reward-points-card__content">
            <div>
              <p className="eyebrow reward-eyebrow-icon">
                <span className="reward-tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="gift" />
                </span>
                Treasure jar
              </p>
              <h3>Your quest stars</h3>
            </div>
            <div className="reward-points-card__count">{pointsBalance}</div>
            <div className="reward-points-card__footer">
              <Badge tone="warm" className="reward-openmoji-badge">
                <span className="reward-inline-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="star" />
                </span>
                <span>+{latestPointsEarned} latest</span>
              </Badge>
              <span>{pointsToNextMilestone} to next treasure</span>
            </div>
          </div>
          <div className="reward-treasure-jar" aria-hidden="true">
            {Array.from({ length: treasureStarCount }).map((_, index) => (
              <span key={index}>
                <OpenMojiIcon name={index % 3 === 1 ? "sparkles" : "star"} />
              </span>
            ))}
          </div>
        </Card>

        <Card className="reward-milestone-card" variant="soft">
          <div className="reward-milestone-card__icon" aria-hidden="true">
            <OpenMojiIcon name="target" />
          </div>
          <div className="reward-milestone-card__copy">
            <p className="eyebrow">Next treasure</p>
            <h3>{pointsToNextMilestone} stars away</h3>
            <p className="page-text">{milestoneMessage}</p>
            <div
              className="reward-milestone-progress"
              role="progressbar"
              aria-label="Next treasure progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={milestoneProgress}
            >
              <span style={{ width: `${milestoneProgress}%` }} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="reward-shelf-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow reward-eyebrow-icon">
              <span className="reward-tiny-openmoji" aria-hidden="true">
                <OpenMojiIcon name="gift" />
              </span>
              Reward shelf
            </p>
            <h3>Choose a reward</h3>
          </div>
          <Badge tone="mint" className="reward-openmoji-badge">
            <span className="reward-inline-openmoji" aria-hidden="true">
              <OpenMojiIcon name="sparkles" />
            </span>
            <span>{parentRewards.length} choices</span>
          </Badge>
        </div>

        {parentRewards.length > 0 ? (
          <div className="reward-shelf-grid">
            {parentRewards.map((reward) => (
              <Card
                key={reward.id}
                className="reward-item-card reward-item-card--simple"
                variant="soft"
              >
                <div className="reward-item-card__top">
                  <span className="reward-item-card__emoji" aria-hidden="true">
                    <OpenMojiIcon name="gift" />
                  </span>
                  <h4>{reward.title}</h4>
                </div>
                <div className="reward-item-card__meta">
                  <span className="reward-openmoji-badge">
                    <span className="reward-inline-openmoji" aria-hidden="true">
                      <OpenMojiIcon name="star" />
                    </span>
                    <span>{reward.cost} stars</span>
                  </span>
                </div>
                <Button
                  onClick={() => handleClaimReward(reward)}
                  disabled={
                    Boolean(claimingRewardId) ||
                    pointsBalance < Number(reward.cost || 0)
                  }
                >
                  {claimingRewardId === String(reward.id) ? "Getting..." : "Choose"}
                </Button>
                {pointsBalance < Number(reward.cost || 0) ? (
                  <p className="reward-helper-text">
                    {Number(reward.cost || 0) - pointsBalance} more stars needed.
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <div className="reward-empty-state">
            <span className="reward-empty-state__icon" aria-hidden="true">
              <OpenMojiIcon name="seedling" />
            </span>
            <p className="page-text">No rewards yet.</p>
          </div>
        )}

        {claimError ? <p className="parent-dashboard__message">{claimError}</p> : null}
        {claimMessage ? <p className="reward-success-message">{claimMessage}</p> : null}
      </Card>

      <Card className="reward-activity-card" variant="default">
        <div className="reward-section-heading">
          <div>
            <p className="eyebrow reward-eyebrow-icon">
              <span className="reward-tiny-openmoji" aria-hidden="true">
                <OpenMojiIcon name="memo" />
              </span>
              Star trail
            </p>
            <h3>Recent stars</h3>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => {
            const isClaim =
              transaction.transaction_type === "claim" ||
              transaction.transaction_type === "redeem";

            return (
              <div
                key={
                  transaction.transaction_id ||
                  `${transaction.task_id}-${transaction.created_at}`
                }
                className="reward-activity-item"
              >
                <div className="reward-activity-item__icon" aria-hidden="true">
                  <OpenMojiIcon name={isClaim ? "gift" : "check"} />
                </div>
                <p>
                  {isClaim ? (
                    <>
                      <strong>{Math.abs(transaction.points_earned)} stars used</strong>
                      {transaction.reward_title
                        ? ` for ${transaction.reward_title}`
                        : " for a reward"}
                    </>
                  ) : (
                    <>
                      <strong>+{transaction.points_earned} stars</strong>
                      {transaction.task_title
                        ? ` from ${transaction.task_title}`
                        : " from a quest"}
                    </>
                  )}
                </p>
              </div>
            );
          })
        ) : (
          <div className="reward-empty-state">
            <span className="reward-empty-state__icon" aria-hidden="true">
              <OpenMojiIcon name="star" />
            </span>
            <p className="page-text">No star activity yet.</p>
          </div>
        )}
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
                <OpenMojiIcon name="star" />
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--2">
                <OpenMojiIcon name="sparkles" />
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--3">
                <OpenMojiIcon name="star" />
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--4">
                <OpenMojiIcon name="sparkles" />
              </span>
              <span className="reward-celebration-modal__spark reward-celebration-modal__spark--5">
                <OpenMojiIcon name="star" />
              </span>
            </div>

            <div className="reward-celebration-modal__content">
              <div className="reward-celebration-modal__hero" aria-hidden="true">
                <OpenMojiIcon name="star" />
              </div>
              <h3 id="reward-celebration-title">Quest complete</h3>
              <p className="page-text">Stars added to your jar.</p>

              <div className="reward-celebration-modal__stats">
                <div>
                  <span className="reward-celebration-modal__stat-icon" aria-hidden="true">
                    <OpenMojiIcon name="star" />
                  </span>
                  <strong>+{latestPointsEarned}</strong>
                  <span>earned</span>
                </div>
                <div>
                  <span className="reward-celebration-modal__stat-icon" aria-hidden="true">
                    <OpenMojiIcon name="gift" />
                  </span>
                  <strong>{updatedPointsBalance}</strong>
                  <span>in jar</span>
                </div>
              </div>

              <div className="reward-celebration-modal__actions">
                <Button onClick={handleGoToMyTasks}>Back to Quest Hub</Button>
                <Button variant="secondary" onClick={handleStartAnotherTask}>
                  Start Another Quest
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
