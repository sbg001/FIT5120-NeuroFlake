import { Link } from "react-router-dom";
import { useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";

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
          <div className="home-badge-row">
            <Badge tone="mint">Soft structure</Badge>
            <Badge tone="sky">Calm focus</Badge>
            <Badge tone="warm">Small wins</Badge>
          </div>
          <PageHeader
            eyebrow="Welcome to NeuroFlake"
            title="Daily tasks can feel like a cozy little adventure"
            description="NeuroFlake helps children move through routines with clear next steps, gentle focus tools, and warm encouragement that parents can trust."
          />

          <div className="home-hero-actions">
            <Button as={Link} to="/login" variant="primary">
              Start
            </Button>
            <Button as="a" href="#how-it-helps" variant="secondary">
              See How It Helps
            </Button>
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
            <ProgressBar value={2} max={3} label="Task progress" />
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

      <Card id="how-it-helps" className="home-panel" variant="glow">
        <PageHeader
          eyebrow="How It Helps"
          title="Try the task journey"
          description="Tap each stage to see how a big routine becomes easier to start, follow, and finish."
        />

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
      </Card>

      <div className="home-support-grid">
        <Card as="article" className="home-support-copy" variant="soft">
          <p className="eyebrow">Support That Adapts</p>
          <h3>Meet the child where they are</h3>
          <p>
            Some days need momentum. Some days need a pause. NeuroFlake keeps
            the next step calm and concrete.
          </p>
        </Card>

        <Card as="article" className="home-support-tool" variant="default">
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
        </Card>
      </div>

      <Card as="article" className="home-companion-panel" variant="glow">
        <div className="home-companion-copy">
          <p className="eyebrow">AI Companion</p>
          <h3>A built-in chat helper for children and parents</h3>
          <p>
            NeuroFlake includes an AI companion that can give gentle prompts,
            answer questions, and support the next step once you are signed in.
          </p>
          <div className="home-companion-pills">
            <span>Child-friendly encouragement</span>
            <span>Parent support guidance</span>
            <span>Available after login</span>
          </div>
          <Button as={Link} to="/login" variant="secondary">
            Explore In App
          </Button>
        </div>

        <div className="home-companion-preview" aria-hidden="true">
          <div className="home-companion-bubble home-companion-bubble--bot">
            Let&apos;s take the next step together.
          </div>
          <div className="home-companion-bubble home-companion-bubble--user">
            What should I do first?
          </div>
          <div className="home-companion-avatar">
            <img src="/logo.png" alt="" />
          </div>
        </div>
      </Card>

      <div className="home-values">
        <Card as="article" className="feature-card" variant="soft">
          <h3>For Children</h3>
          <p>Simple words, visible progress, and one step at a time.</p>
        </Card>
        <Card as="article" className="feature-card" variant="soft">
          <h3>For Parents</h3>
          <p>Create routines, guide priorities, and choose meaningful rewards.</p>
        </Card>
      </div>
    </section>
  );
}

export default Home;
