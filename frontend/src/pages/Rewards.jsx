import { useEffect, useState } from "react";
import {
  getPointsBalance,
  getLatestRewardSummary,
  getRewardTransactions,
} from "../services";

function Rewards() {
  const [pointsData, setPointsData] = useState(null);
  const [latestRewardSummary, setLatestRewardSummary] = useState(null);
  const [rewardTransactions, setRewardTransactions] = useState([]);

  useEffect(() => {
    async function loadRewardsData() {
      const pointsResult = await getPointsBalance();
      const latestSummaryResult = await getLatestRewardSummary();
      const transactionsResult = await getRewardTransactions();

      setPointsData(pointsResult.data);
      setLatestRewardSummary(latestSummaryResult.data);
      setRewardTransactions(transactionsResult.data || []);
    }

    loadRewardsData();
  }, []);

  if (!pointsData || !latestRewardSummary) {
    return (
      <section className="page-section">
        <p>Loading rewards...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Rewards</p>
        <h2 className="page-title">Encouragement and celebration will appear here</h2>
        <p className="page-text">
          This page will later support earned rewards, celebrations, and
          personalised motivation.
        </p>
      </div>

      <div className="content-card">
        <h3>Rewards shell ready</h3>
        <p>
          The rewards system will be connected to task completion after the task
          flow is built.
        </p>
        <p>Current points: {pointsData.points_balance}</p>
        <p>Latest reward points: {latestRewardSummary.points_earned}</p>
        <p>Total reward records: {rewardTransactions.length}</p>
      </div>
    </section>
  );
}

export default Rewards;