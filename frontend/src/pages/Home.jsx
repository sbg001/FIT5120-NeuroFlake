import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="page-section">
      <div className="hero-card">
        <p className="eyebrow">Welcome to NeuroFlake</p>
        <h2 className="page-title">A calm and supportive space for daily tasks</h2>
        <p className="page-text">
          NeuroFlake helps children move through tasks step by step in a simple,
          gentle, and encouraging way.
        </p>

        <div className="button-row">
          <Link to="/child" className="primary-button">
            Enter Child Dashboard
          </Link>
          <Link to="/parent" className="secondary-button">
            Open Parent Dashboard
          </Link>
        </div>
      </div>

      <div className="card-grid">
        <article className="info-card">
          <h3>Task Support</h3>
          <p>Clear, simple steps to reduce overwhelm.</p>
        </article>

        <article className="info-card">
          <h3>Focus Mode</h3>
          <p>A distraction-light screen for better concentration.</p>
        </article>

        <article className="info-card">
          <h3>Rewards</h3>
          <p>Encouraging feedback to help build confidence.</p>
        </article>
      </div>
    </section>
  );
}

export default Home;