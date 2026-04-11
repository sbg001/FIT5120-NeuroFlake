import { Link } from "react-router-dom";

function ChildDashboard() {
  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Child Dashboard</p>
        <h2 className="page-title">Choose what you want to do</h2>
        <p className="page-text">
          This page will become the main starting point for the child experience.
        </p>
      </div>

      <div className="card-grid">
        <article className="feature-card">
          <h3>Start a Task</h3>
          <p>Go through a task one step at a time.</p>
          <Link to="/tasks" className="primary-button small-button">
            Open Tasks
          </Link>
        </article>

        <article className="feature-card">
          <h3>Use Focus Mode</h3>
          <p>Enter a calmer view for guided task completion.</p>
          <Link to="/focus" className="primary-button small-button">
            Open Focus Mode
          </Link>
        </article>

        <article className="feature-card">
          <h3>See Rewards</h3>
          <p>View encouragement, points, and achievements.</p>
          <Link to="/rewards" className="primary-button small-button">
            Open Rewards
          </Link>
        </article>
      </div>
    </section>
  );
}

export default ChildDashboard;