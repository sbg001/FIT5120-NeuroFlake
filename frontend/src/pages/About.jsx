function About() {
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

  return (
    <section className="about-page">
      <section className="home-flow-section" aria-labelledby="about-features-title">
        <div className="home-section-heading">
          <p className="home-landing-kicker">About NeuroFlake</p>
          <h3 id="about-features-title">Support for each task step.</h3>
        </div>

        <div className="home-app-grid">
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
        </div>
      </section>

      <section className="home-flow-section" aria-labelledby="about-flow-title">
        <div className="home-section-heading">
          <p className="home-landing-kicker">How it works</p>
          <h3 id="about-flow-title">Simple enough to start today.</h3>
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
  );
}

export default About;
