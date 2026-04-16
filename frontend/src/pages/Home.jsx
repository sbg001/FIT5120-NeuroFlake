import { Link } from "react-router-dom";
import { useState } from "react";

function Home() {
  const journeySteps = [
    {
      id: "plan",
      label: "Plan",
      title: "Pack school bag",
      action: "Find the bag and put it on the table.",
      note: "One clear start.",
    },
    {
      id: "focus",
      label: "Focus",
      title: "Stay with one step",
      action: "Put the lunchbox inside the bag.",
      note: "A calm timer can wait nearby.",
    },
    {
      id: "celebrate",
      label: "Celebrate",
      title: "Mark it done",
      action: "Close the bag and choose a reward.",
      note: "Progress feels visible.",
    },
  ];

  const supportModes = [
    {
      id: "calm",
      label: "Calm",
      message: "Keep the next step simple and steady.",
    },
    {
      id: "stuck",
      label: "Stuck",
      message: "Make the step smaller and offer a gentle prompt.",
    },
    {
      id: "overwhelmed",
      label: "Overwhelmed",
      message: "Pause, breathe, and return when the child is ready.",
    },
  ];

  const [activeJourneyId, setActiveJourneyId] = useState(journeySteps[0].id);
  const [activeSupportId, setActiveSupportId] = useState(supportModes[0].id);

  const activeJourney =
    journeySteps.find((step) => step.id === activeJourneyId) || journeySteps[0];
  const activeSupport =
    supportModes.find((mode) => mode.id === activeSupportId) || supportModes[0];

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Welcome to NeuroFlake</p>
          <h2 className="home-title">Daily tasks, one gentle step at a time</h2>
          <p className="home-lede">
            NeuroFlake helps children move through routines with clear steps,
            focus support, and kind encouragement.
          </p>

          <div className="home-hero-actions">
            <Link to="/login" className="primary-button">
              Start
            </Link>
            <a href="#how-it-helps" className="secondary-button">
              See How It Helps
            </a>
          </div>
        </div>

        <div className="home-preview" aria-label="NeuroFlake task preview">
          <img
            className="home-preview-logo"
            src="/logo.png"
            alt="NeuroFlake robot holding a snowflake"
          />
          <div className="home-preview-orbit" aria-hidden="true">
            <span>Plan</span>
            <span>Focus</span>
            <span>Reward</span>
          </div>
          <div className="home-preview-card">
            <p className="home-preview-label">Today</p>
            <h3>Get ready for school</h3>
            <div className="home-step-row is-done">
              <span>1</span>
              <p>Put on shoes</p>
            </div>
            <div className="home-step-row is-active">
              <span>2</span>
              <p>Pack lunchbox</p>
            </div>
            <div className="home-step-row">
              <span>3</span>
              <p>Zip the bag</p>
            </div>
          </div>
        </div>
      </div>

      <div id="how-it-helps" className="home-panel">
        <div className="section-header">
          <p className="eyebrow">How It Helps</p>
          <h3>Try the task journey</h3>
          <p className="page-text">
            Tap each stage to see how a big routine becomes easier to start,
            follow, and finish.
          </p>
        </div>

        <div className="home-journey-tabs">
          {journeySteps.map((step) => (
            <button
              key={step.id}
              type="button"
              className={
                step.id === activeJourneyId
                  ? "home-tab is-selected"
                  : "home-tab"
              }
              onClick={() => setActiveJourneyId(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>

        <div className="home-journey-display">
          <div>
            <p className="home-preview-label">{activeJourney.label}</p>
            <h3>{activeJourney.title}</h3>
            <p>{activeJourney.action}</p>
          </div>
          <strong>{activeJourney.note}</strong>
        </div>
      </div>

      <div className="home-support-grid">
        <article className="home-support-copy">
          <p className="eyebrow">Support That Adapts</p>
          <h3>Meet the child where they are</h3>
          <p>
            Some days need momentum. Some days need a pause. NeuroFlake keeps
            the next step calm and concrete.
          </p>
        </article>

        <article className="home-support-tool">
          <div className="home-mode-buttons">
            {supportModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={
                  mode.id === activeSupportId
                    ? "home-mode-button is-selected"
                    : "home-mode-button"
                }
                onClick={() => setActiveSupportId(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p>{activeSupport.message}</p>
        </article>
      </div>

      <div className="home-values">
        <article className="feature-card">
          <h3>For Children</h3>
          <p>Simple words, visible progress, and one step at a time.</p>
        </article>
        <article className="feature-card">
          <h3>For Parents</h3>
          <p>Create routines, guide priorities, and choose meaningful rewards.</p>
        </article>
      </div>
    </section>
  );
}

export default Home;
