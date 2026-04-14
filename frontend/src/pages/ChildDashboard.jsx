import { Link } from "react-router-dom";
import InfoCard from "../components/ui/InfoCard";
import { useEffect, useState } from "react";
import {
  getTasks,
  getPointsBalance,
  getChildProfile,
} from "../services";

function ChildDashboard() {
  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data: childData } = await getChildProfile();
      const { data: tasksData } = await getTasks();
      const { data: pointsData } = await getPointsBalance();

      setChild(childData);
      setTasks(tasksData || []);
      setPoints(pointsData);
    }

    loadData();
  }, []);

  const availableTasks = tasks.slice(0, 3);

  if (!child) {
    return <p className="page-text">Loading dashboard...</p>;
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Child Dashboard</p>
        <h2 className="page-title">
          Hi {child.name}, what would you like to do today?
        </h2>
        <p className="page-text">
          A calm, simple space to help you move through tasks one step at a time.
        </p>
      </div>

      <div className="card-grid">
        <InfoCard title="My Profile">
          <p>Age: {child.age}</p>
          <p>Points: {points?.points_balance ?? 0}</p>
        </InfoCard>

        <InfoCard title="Today's Tasks">
          <p>{availableTasks.length} tasks ready to start</p>
        </InfoCard>

        <InfoCard title="Progress">
          <p>Keep going! You're doing great 💪</p>
        </InfoCard>
      </div>

      <div className="card-grid">
        {availableTasks.map((task) => (
          <article key={task.task_id} className="feature-card">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>
              Steps: {task.completed_steps} / {task.total_steps}
            </p>

            <Link to={`/tasks/${task.task_id}`} className="primary-button small-button">
              Open Task
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ChildDashboard;