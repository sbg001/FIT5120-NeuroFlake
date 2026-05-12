import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import {
  getTasks,
  getPointsBalance,
  getChildProfile,
  getChildPreferences,
  upsertChildPreferences,
} from "../services";

function ChildDashboard() {
  const [child, setChild] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [characterStyle, setCharacterStyle] = useState("star");
  const [preferenceMessage, setPreferenceMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoadingBoard(true);
      setLoadError("");
      const childResult = await getChildProfile();
      const childData = childResult.data;

      setChild(childData);

      if (!childData?.user_id) {
        setTasks([]);
        setPoints({ points_balance: 0 });
        setLoadError(
          childResult.error || "We could not load the child dashboard right now."
        );
        setIsLoadingBoard(false);
        return;
      }

      const [tasksResult, pointsResult, preferenceResult] = await Promise.all([
        getTasks(childData?.user_id),
        getPointsBalance(childData?.user_id),
        getChildPreferences(),
      ]);

      setTasks(tasksResult.data || []);
      setPoints(pointsResult.data);

      if (preferenceResult.data) {
        setCharacterStyle(preferenceResult.data.character_style || "star");
      }

      setLoadError(
        childResult.error ||
          tasksResult.error ||
          pointsResult.error ||
          preferenceResult.error ||
          ""
      );

      setIsLoadingBoard(false);
    }

    loadData();
  }, []);

  const handleSavePreferences = async () => {
    setPreferenceMessage("");

    const result = await upsertChildPreferences({
      child_id: child?.user_id,
      character_style: characterStyle,
    });

    if (result.error) {
      setPreferenceMessage("Could not save your buddy choice yet.");
      return;
    }

    setPreferenceMessage("Your buddy is ready.");
    window.dispatchEvent(new Event("preferencesUpdated"));
  };

  if (isLoadingBoard) {
    return <p className="page-text">Loading dashboard...</p>;
  }

  if (!child) {
    return (
      <section className="page-section child-dashboard">
        <Card className="content-card" variant="soft">
          <p className="page-text">
            {loadError || "The child dashboard is not ready right now."}
          </p>
        </Card>
      </section>
    );
  }

  const displayName = String(child.name || "").replace(/\s*\([^)]*\)\s*$/, "");
  const childTasks = tasks.filter(
    (task) => String(task.child_id) === String(child.user_id)
  );

  const readyTasks = childTasks
    .filter(
      (task) =>
        task.status !== "completed" &&
        Number(task.completed_steps || 0) < Number(task.total_steps || 0)
    )
    .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

  const completedTasks = childTasks
    .filter(
      (task) =>
        task.status === "completed" ||
        Number(task.completed_steps || 0) >= Number(task.total_steps || 0)
    )
    .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0));

  const featuredTask = readyTasks[0] || completedTasks[0] || null;
  const extraTasks = readyTasks.slice(1, 3);
  const completedCount = completedTasks.length;
  const pointsBalance = points?.points_balance ?? 0;

  const characterMap = {
    star: "\u2B50",
    rocket: "\u{1F680}",
    bear: "\u{1F9F8}",
    cat: "\u{1F431}",
    dog: "\u{1F436}",
    fox: "\u{1F98A}",
  };

  const currentCharacter = characterMap[characterStyle] || "\u2B50";

  const missionMessage = featuredTask
    ? featuredTask.status === "completed"
      ? "This task is already finished. You can look back at it."
      : "Start here. One small step is enough."
    : "No tasks are waiting right now.";

  const featuredProgressValue = featuredTask
    ? Number(featuredTask.completed_steps || 0)
    : 0;
  const featuredProgressMax = featuredTask
    ? Math.max(Number(featuredTask.total_steps || 0), 1)
    : 1;

  return (
    <section className="page-section child-dashboard child-dashboard--simple">
      <div className="child-dashboard__intro">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Hi {displayName}. One task, then one win.</h2>
          <p className="page-text">
            Your board shows the next thing first. The extra bits stay out of the way.
          </p>
        </div>
        <div className="child-dashboard__intro-pills" aria-label="Today summary">
          <Badge tone="mint">{readyTasks.length} ready</Badge>
          <Badge tone="sky">{completedCount} done</Badge>
          <Badge tone="warm">{pointsBalance} points</Badge>
        </div>
      </div>

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      <div className="child-dashboard__workspace">
        <Card className="child-dashboard__focus-card nf-enter-card nf-enter-card--1" variant="glow">
          <div className="child-dashboard__focus-head">
            <div>
              <p className="eyebrow">Do this now</p>
              <h3 className="child-dashboard__mission-title">
                {featuredTask ? featuredTask.title : "Nothing waiting right now"}
              </h3>
            </div>
            {featuredTask?.priority_type ? (
              <Badge tone="warm">
                {featuredTask.priority_type} {featuredTask.priority_rank}
              </Badge>
            ) : null}
          </div>

          <p className="page-text child-dashboard__mission-copy">
            {featuredTask?.description || missionMessage}
          </p>

          {featuredTask ? (
            <>
              <div className="child-dashboard__mission-progress">
                <div className="child-dashboard__mission-progress-label">
                  <span>
                    {featuredTask.completed_steps} of {featuredTask.total_steps} steps done
                  </span>
                  <span>
                    {featuredTask.status === "completed" ? "Finished" : "Ready"}
                  </span>
                </div>
                <ProgressBar
                  value={featuredProgressValue}
                  max={featuredProgressMax}
                  label="Featured mission progress"
                />
              </div>

              <div className="child-dashboard__focus-action-row">
                <Button as={Link} to={`/tasks/${featuredTask.task_id}`} size="lg">
                  {featuredTask.status === "completed" ? "See Task" : "Start Task"}
                </Button>
                <p className="page-text">{missionMessage}</p>
              </div>
            </>
          ) : (
            <div className="child-dashboard__focus-action-row">
              <Button as={Link} to="/rewards" variant="secondary" size="lg">
                See Rewards
              </Button>
              <p className="page-text">You can rest or look at what you earned.</p>
            </div>
          )}
        </Card>

        <div className="child-dashboard__support-stack">
          <Card className="child-dashboard__journey-card nf-enter-card nf-enter-card--2" variant="soft">
            <div className="child-dashboard__journey-title">
              <p className="eyebrow">Your path</p>
              <div className="child-dashboard__mascot child-dashboard__mascot--compact">
                {currentCharacter}
              </div>
            </div>
            <div className="child-dashboard__journey-track">
              <div className="child-dashboard__journey-step">
                <strong>1</strong>
                <span>Start</span>
              </div>
              <div className="child-dashboard__journey-arrow" aria-hidden="true">
                &gt;
              </div>
              <div className="child-dashboard__journey-step child-dashboard__journey-step--focus">
                <strong>2</strong>
                <span>Focus</span>
              </div>
              <div className="child-dashboard__journey-arrow" aria-hidden="true">
                &gt;
              </div>
              <div className="child-dashboard__journey-step">
                <strong>3</strong>
                <span>Win</span>
              </div>
            </div>
            <p className="page-text child-dashboard__journey-note">
              Focus appears inside the task when you want a calmer step-by-step view.
            </p>
          </Card>

          <Card className="child-dashboard__reward-card nf-enter-card nf-enter-card--3" variant="soft">
            <div className="child-dashboard__reward-head">
              <div>
                <p className="eyebrow">Rewards</p>
                <h3>See what you earned</h3>
              </div>
              <div className="child-dashboard__reward-count">{pointsBalance}</div>
            </div>
            <Button as={Link} to="/rewards" variant="secondary">
              Open Rewards
            </Button>
          </Card>
        </div>
      </div>

      <div className="child-dashboard__bottom-grid child-dashboard__bottom-grid--simple">
        <Card className="child-dashboard__missions-list nf-enter-card nf-enter-card--4" variant="default">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">More tasks</p>
              <h3>After this one</h3>
            </div>
            <Badge tone="sky">
              {readyTasks.length > 1 ? `${readyTasks.length - 1} more` : "One at a time"}
            </Badge>
          </div>

          <div className="child-dashboard__mini-missions">
            {(extraTasks.length > 0 ? extraTasks : completedTasks.slice(0, 2)).map((task) => (
              <div key={task.task_id} className="child-dashboard__mini-mission">
                <div>
                  <h4>
                    {currentCharacter} {task.title}
                  </h4>
                  <p>
                    {task.completed_steps} / {task.total_steps} steps done
                  </p>
                </div>
                <Button as={Link} to={`/tasks/${task.task_id}`} variant="secondary" size="sm">
                  {task.status === "completed" ? "View" : "Open"}
                </Button>
              </div>
            ))}

            {extraTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="page-text">
                No extra tasks right now.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="child-dashboard__style-card nf-enter-card nf-enter-card--5" variant="soft">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">Buddy</p>
              <h3>Choose your buddy</h3>
            </div>
            <div className="child-dashboard__style-identity">{currentCharacter}</div>
          </div>

          <div className="child-dashboard__style-form">
            <select
              value={characterStyle}
              onChange={(e) => setCharacterStyle(e.target.value)}
            >
              <option value="star">Star Character</option>
              <option value="rocket">Rocket Character</option>
              <option value="bear">Bear Character</option>
              <option value="cat">Cat Character</option>
              <option value="dog">Dog Character</option>
              <option value="fox">Fox Character</option>
            </select>

            {preferenceMessage ? (
              <p className="page-text child-dashboard__style-message">
                {preferenceMessage}
              </p>
            ) : null}

            <Button onClick={handleSavePreferences}>Save My Buddy</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default ChildDashboard;
