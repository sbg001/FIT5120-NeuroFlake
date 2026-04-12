import { Link } from "react-router-dom";
import InfoCard from "../components/ui/InfoCard";
import childProfile from "../data/childProfile";
import tasks from "../data/tasks";
import rewards from "../data/rewards";
import { useEffect } from "react";
import { getTasks } from "../services/taskService";

function ChildDashboard() {
  useEffect(() => {
  async function testTasks() {
    const result = await getTasks();
    console.log("tasks result:", result);
  }

  testTasks();
}, []);
  const availableTasks = tasks.slice(0, 3);
  const nextReward = rewards[0];

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Child Dashboard</p>
        <h2 className="page-title">Hi {childProfile.name}, what would you like to do today?</h2>
        <p className="page-text">
          A calm, simple space to help you move through tasks one step at a time.
        </p>
      </div>

      <div className="card-grid">
        <InfoCard title="My Support Style">
          <p>Theme: {childProfile.favouriteTheme}</p>
          <p>Points: {childProfile.rewardPoints}</p>
        </InfoCard>

        <InfoCard title="Next Reward">
          <p>{nextReward.title}</p>
          <p>{nextReward.pointsRequired} points needed</p>
        </InfoCard>

        <InfoCard title="Today's Tasks">
          <p>{availableTasks.length} tasks ready to start</p>
        </InfoCard>
      </div>

      <div className="card-grid">
        {availableTasks.map((task) => (
          <article key={task.id} className="feature-card">
            <h3>{task.title}</h3>
            <p>Category: {task.category}</p>
            <p>Steps: {task.stepsCount}</p>
            <p>Time: {task.estimatedMinutes} mins</p>
            <Link to="/tasks" className="primary-button small-button">
              Open Task
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ChildDashboard;