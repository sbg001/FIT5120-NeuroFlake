import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ProgressBar from "../components/ui/ProgressBar";

function Home() {
  const featureGroups = {
    child: {
      label: "Child",
      visual: "child",
      title: "A clear next step",
      text: "Children see one task, one timer, and one small win at a time.",
      items: ["Task steps", "Focus mode", "Rewards"],
    },
    parent: {
      label: "Parent",
      visual: "parent",
      title: "Create tasks without constant reminders",
      text: "Parents create tasks, rewards, and support plans from one place.",
      items: ["Task creation", "Progress insights", "Support guidance"],
    },
    support: {
      label: "Support",
      visual: "support",
      title: "Help when the day changes",
      text: "Prompts stay short, calm, and flexible for stuck moments.",
      items: ["Gentle prompts", "Break tasks down", "AI helper"],
    },
  };

  const appFeatures = [
    {
      title: "Task creation",
      text: "Parents can create clear task steps for school, home, and bedtime.",
      visual: "task",
    },
    {
      title: "Focus mode",
      text: "A calm task screen with timer, prompts, and fewer distractions.",
      visual: "focus",
    },
    {
      title: "Rewards",
      text: "Children can see effort turn into progress and small wins.",
      visual: "reward",
    },
    {
      title: "Parent",
      text: "Create tasks, manage children, and adjust supports safely.",
      visual: "parent",
    },
    {
      title: "Insights",
      text: "Track tasks, moods, progress, and what support works.",
      visual: "insight",
    },
    {
      title: "AI helper",
      text: "Child-friendly guidance and parent support when needed.",
      visual: "helper",
    },
  ];

  const demoScenes = [
    {
      id: "start",
      label: "Start",
      title: "Pick one step",
      caption: "Bag first. Everything else can wait.",
      progress: 1,
      icon: "/nova-robot.png",
      iconAlt: "NeuroFlake helper ready to start",
    },
    {
      id: "focus",
      label: "Focus",
      title: "Stay with it",
      caption: "A calm timer keeps the task small.",
      progress: 2,
      icon: "/logo.png",
      iconAlt: "NeuroFlake helper focusing",
    },
    {
      id: "reward",
      label: "Reward",
      title: "See the win",
      caption: "Progress turns into a clear reward.",
      progress: 3,
      icon: "/nova-robot.png",
      iconAlt: "NeuroFlake helper celebrating",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create the task",
      text: "Parents add the steps.",
    },
    {
      step: "2",
      title: "Follow the next step",
      text: "Children see what to do now.",
    },
    {
      step: "3",
      title: "Celebrate progress",
      text: "Rewards make effort visible.",
    },
  ];

  const featureKeys = Object.keys(featureGroups);
  const [activeFeature, setActiveFeature] = useState("child");
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const currentFeature = featureGroups[activeFeature];
  const activeDemo = demoScenes[activeDemoIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveDemoIndex((currentIndex) => (currentIndex + 1) % demoScenes.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [demoScenes.length]);

  return (
    <>
      <section className="home-page home-page--landing">
        <div className="home-landing-hero">
          <div className="home-landing-copy">
            <p className="home-landing-kicker">NeuroFlake</p>
            <h2>Turn daily tasks into clear little wins.</h2>
            <p>
              A calmer way for children to start, focus, finish, and feel proud.
            </p>

            <div className="home-entry-panel" aria-label="Choose how to enter NeuroFlake">
              <Link to="/login?role=parent&mode=sign-up" className="home-entry-start-card">
                <span>New here?</span>
                <strong>Get started</strong>
                <p>Create a parent account and add the first task.</p>
              </Link>

              <div className="home-entry-returning">
                <p>Already a user?</p>
                <div className="home-entry-grid">
                  <Link to="/login?role=parent" className="home-entry-card home-entry-card--parent">
                    <span>Parent</span>
                    <strong>Sign in</strong>
                  </Link>
                  <Link to="/login?role=child" className="home-entry-card home-entry-card--child">
                    <span>Child</span>
                    <strong>Sign in</strong>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="home-demo-section home-demo-section--hero" aria-label="Animated NeuroFlake journey">
            <div className={`home-demo-screen home-demo-screen--${activeDemo.id}`}>
              <div className="home-demo-orbit" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <div className={`home-demo-mascot home-demo-mascot--${activeDemo.id}`}>
                <span className="home-demo-mascot__signal home-demo-mascot__signal--one" />
                <span className="home-demo-mascot__signal home-demo-mascot__signal--two" />
                <img src={activeDemo.icon} alt={activeDemo.iconAlt} />
                <span className="home-demo-mascot__shadow" />
              </div>

              <div className="home-demo-card">
                <span>{activeDemo.label}</span>
                <h4>{activeDemo.title}</h4>
                <p>{activeDemo.caption}</p>
                <ProgressBar value={activeDemo.progress} max={3} label="Demo progress" />
              </div>
            </div>
          </div>
        </div>

        <section className="home-feature-showcase" aria-labelledby="home-showcase-title">
          <div className="home-section-heading">
            <p className="home-landing-kicker">Built for real tasks</p>
            <h3 id="home-showcase-title">One app, three clear paths.</h3>
          </div>

          <div className="home-feature-tabs" role="tablist" aria-label="Feature views">
            {featureKeys.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeFeature === key}
                className={
                  activeFeature === key
                    ? "home-feature-tab is-selected"
                    : "home-feature-tab"
                }
                onClick={() => setActiveFeature(key)}
              >
                <span
                  className={`home-feature-tab__icon home-feature-tab__icon--${featureGroups[key].visual}`}
                  aria-hidden="true"
                />
                <strong>{featureGroups[key].label}</strong>
              </button>
            ))}
          </div>

          <div className="home-feature-panel">
            <div className={`home-feature-visual home-feature-visual--${currentFeature.visual}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="home-feature-copy">
              <h4>{currentFeature.title}</h4>
              <p>{currentFeature.text}</p>
            </div>
            <div className="home-feature-pills">
              {currentFeature.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="home-app-grid" aria-label="NeuroFlake features">
          {appFeatures.map((feature) => (
            <article key={feature.title} className="home-app-card">
              <div
                className={`home-app-card__symbol home-app-card__symbol--${feature.visual}`}
                aria-hidden="true"
              />
              <h4>{feature.title}</h4>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="home-flow-section" aria-labelledby="home-flow-title">
          <div className="home-section-heading">
            <p className="home-landing-kicker">How it works</p>
            <h3 id="home-flow-title">Simple enough to start today.</h3>
          </div>

          <div className="home-flow-grid">
            {howItWorks.map((item) => (
              <article key={item.step} className="home-flow-card">
                <span>{item.step}</span>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="home-flow-section mt-10 md:mt-14" aria-label="Footer">
        <div className="home-section-heading">
          <p className="home-landing-kicker">Support</p>
          <h3>Support</h3>
        </div>

        <div className="home-flow-grid">
          <Link to="/privacy-policy" className="home-flow-card">
            <span aria-hidden="true">1</span>
            <h4>Privacy Policy</h4>
          </Link>

          <Link to="/terms-and-conditions" className="home-flow-card">
            <span aria-hidden="true">2</span>
            <h4>Terms & Conditions</h4>
          </Link>
        </div>

        <p className="mt-2 text-center text-[18px] md:text-[20px] text-black">
          © 2026 NeuroFlake. Made with care for every small step.
        </p>
      </section>
    </>
  );
}

export default Home;