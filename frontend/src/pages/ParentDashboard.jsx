import InfoCard from "../components/ui/InfoCard";
import parentProfile from "../data/parentProfile";
import childProfile from "../data/childProfile";
import tasks from "../data/tasks";
import rewards from "../data/rewards";

function ParentDashboard() {
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
          {parentProfile.goals.map((goal) => (
            <p key={goal}>{goal}</p>
          ))}
        </InfoCard>

        <InfoCard title="Task Overview">
          <p>Total tasks: {tasks.length}</p>
          <p>Ready tasks: {tasks.filter((task) => task.status === "Ready").length}</p>
        </InfoCard>

        <InfoCard title="Reward Overview">
          <p>Available rewards: {rewards.length}</p>
          <p>Current points: {childProfile.rewardPoints}</p>
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