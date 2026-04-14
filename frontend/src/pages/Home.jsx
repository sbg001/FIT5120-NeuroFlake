import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getChildProfile,
  getParentProfile,
  getTasks,
} from "../services";

function Home() {
  const [child, setChild] = useState(null);
  const [parent, setParent] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function loadHomeData() {
      const { data: childData } = await getChildProfile();
      const { data: parentData } = await getParentProfile();
      const { data: tasksData } = await getTasks();

      setChild(childData);
      setParent(parentData);
      setTasks(tasksData || []);
    }

    loadHomeData();
  }, []);

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
          {child && <p>Current child profile: {child.name}</p>}
          <p>{tasks.length} tasks available</p>
        </article>

        <article className="info-card">
          <h3>Parent Journey</h3>
          <p>Task setup, progress awareness, and reward guidance.</p>
          {parent && <p>Current parent profile: {parent.name}</p>}
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