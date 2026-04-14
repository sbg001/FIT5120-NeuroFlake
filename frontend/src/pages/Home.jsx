import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="page-section">
      <div className="hero-card">
        <p className="eyebrow">Welcome to NeuroFlake</p>
        <h2 className="page-title">A calm and supportive space for daily tasks</h2>
        <p className="page-text">
          NeuroFlake supports neurodivergent children through simple task guidance,
          calmer focus spaces, and encouraging rewards, while helping parents guide the journey.
        </p>

        <div className="button-row">
          <Link to="/child" className="primary-button">
            Child Dashboard
          </Link>
          <Link to="/parent" className="secondary-button">
            Parent Dashboard
          </Link>
        </div>
      </div>

      <div className="card-grid">
        <article className="info-card">
          <h3>Child Journey</h3>
          <p>Step-by-step tasks, focus support, and visible rewards.</p>
        </article>

        <article className="info-card">
          <h3>Parent Journey</h3>
          <p>Task setup, progress awareness, and reward guidance.</p>
        </article>

        <article className="info-card">
          <h3>Built for Calm</h3>
          <p>Structured, clear, and sensory-considerate interface design.</p>
        </article>
      </div>
    </section>
  );
}

export default Home;