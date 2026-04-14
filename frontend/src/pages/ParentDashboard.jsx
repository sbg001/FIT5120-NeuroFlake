import { useEffect, useState } from "react";
import InfoCard from "../components/ui/InfoCard";
import {
  getParentProfile,
  getChildProfile,
  getTasks,
  getPointsBalance,
} from "../services";

function ParentDashboard() {
  const [parentProfile, setParentProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pointsData, setPointsData] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      const parentResult = await getParentProfile();
      const childResult = await getChildProfile();
      const tasksResult = await getTasks();
      const pointsResult = await getPointsBalance();

      setParentProfile(parentResult.data);
      setChildProfile(childResult.data);
      setTasks(tasksResult.data || []);
      setPointsData(pointsResult.data);
    }

    loadDashboardData();
  }, []);
  
  if (!parentProfile || !childProfile || !pointsData) {
    return (
      <section className="page-section">
        <p>Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Parent Dashboard</p>
        <h2 className="page-title">Welcome, {parentProfile.name}</h2>
        <p className="page-text">
          A simple overview to support {childProfile.name} with tasks, structure, and motivation.
        </p>
      </div>

      <div className="card-grid">
        <InfoCard title="Support Goals">
          <p>Support independence</p>
          <p>Reduce reminder overload</p>
          <p>Track task progress clearly</p>
        </InfoCard>

        <InfoCard title="Task Overview">
          <p>Total tasks: {tasks.length}</p>
          <p>Ready tasks: {tasks.filter((task) => task.status !== "completed").length}</p>
        </InfoCard>

        <InfoCard title="Reward Overview">
          <p>Available rewards: Coming soon</p>
          <p>Current points: {pointsData.points_balance}</p>
        </InfoCard>
      </div>

      <div className="content-card">
        <h3>Parent control space</h3>
        <p>
          This area is ready for task creation, step editing, and reward controls in later user stories.
        </p>
      </div>
    </section>
  );
}

export default ParentDashboard;