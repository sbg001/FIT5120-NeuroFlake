import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import BuddyIcon from "../components/ui/BuddyIcon";
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

  const [characterStyle, setCharacterStyle] = useState("dog");
  const [savedCharacterStyle, setSavedCharacterStyle] = useState("dog");
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
        const savedStyle = preferenceResult.data.character_style || "dog";
        setCharacterStyle(savedStyle);
        setSavedCharacterStyle(savedStyle);
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

    setSavedCharacterStyle(characterStyle);
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

  const characterOptions = [
    { value: "bear", label: "Bear" },
    { value: "cat", label: "Cat" },
    { value: "dog", label: "Dog" },
    { value: "turtle", label: "Turtle" },
    { value: "robot", label: "Robot" },
    { value: "star", label: "Star" },
  ];

  const savedCharacterLabel =
    characterOptions.find((option) => option.value === savedCharacterStyle)?.label ||
    "Dog";

  const featuredProgressValue = featuredTask
    ? Number(featuredTask.completed_steps || 0)
    : 0;
  const featuredProgressMax = featuredTask
    ? Math.max(Number(featuredTask.total_steps || 0), 1)
    : 1;
  const featuredStepText = featuredTask
    ? `${featuredProgressValue} / ${featuredProgressMax} steps`
    : "No steps waiting";

  return (
    <section className="page-section child-dashboard child-dashboard--simple">
      <div className="child-dashboard__intro">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Hi {displayName}, let&apos;s do one small thing.</h2>
        </div>
        <div className="child-dashboard__intro-pills" aria-label="Today summary">
          <Badge tone="mint">{readyTasks.length} ready</Badge>
          <Badge tone="sky">{completedCount} done</Badge>
        </div>
      </div>

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      <div className="child-dashboard__board">
        <Card className="child-dashboard__focus-card nf-enter-card nf-enter-card--1" variant="glow">
          <div className="child-dashboard__focus-head">
            <div>
              <p className="eyebrow">Start here</p>
              <h3 className="child-dashboard__mission-title">
                {featuredTask ? featuredTask.title : "Nothing to do right now"}
              </h3>
            </div>
            <div className="child-dashboard__focus-side">
              <div className="child-dashboard__focus-buddy" aria-hidden="true">
                <BuddyIcon
                  type={savedCharacterStyle}
                  label={`${savedCharacterLabel} buddy`}
                  decorative
                />
              </div>
              {featuredTask?.priority_type ? (
                <Badge tone="warm">
                  {featuredTask.priority_type} {featuredTask.priority_rank}
                </Badge>
              ) : null}
            </div>
          </div>

          {featuredTask ? (
            <>
              <div className="child-dashboard__mission-progress">
                <div className="child-dashboard__mission-progress-label">
                  <span>
                    {featuredStepText}
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
                  {featuredTask.status === "completed" ? "Look Back" : "Let\u2019s Start"}
                </Button>
              </div>
            </>
          ) : (
            <div className="child-dashboard__focus-action-row">
              <Button as={Link} to="/rewards" variant="secondary" size="lg">
                See Rewards
              </Button>
            </div>
          )}
        </Card>

        <Card className="child-dashboard__missions-list nf-enter-card nf-enter-card--3" variant="default">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">Next up</p>
              <h3>After this</h3>
            </div>
            <Badge tone="sky">
              {readyTasks.length > 1 ? `${readyTasks.length - 1} waiting` : "Nice and easy"}
            </Badge>
          </div>

          <div className="child-dashboard__mini-missions">
            {(extraTasks.length > 0 ? extraTasks : completedTasks.slice(0, 2)).map((task) => (
              <div key={task.task_id} className="child-dashboard__mini-mission">
                <div>
                  <h4>
                    <BuddyIcon
                      type={savedCharacterStyle}
                      label=""
                      decorative
                      className="child-dashboard__mini-mission-icon"
                    />
                    {task.title}
                  </h4>
                  <p>
                    {task.completed_steps} / {task.total_steps} steps done
                  </p>
                </div>
                <Button as={Link} to={`/tasks/${task.task_id}`} variant="secondary" size="sm">
                  {task.status === "completed" ? "View" : "Start"}
                </Button>
              </div>
            ))}

            {extraTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="page-text">
                No other tasks right now.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="child-dashboard__reward-card nf-enter-card nf-enter-card--4" variant="soft">
          <div className="child-dashboard__reward-head">
            <div>
              <p className="eyebrow">Rewards</p>
              <h3>Your points</h3>
            </div>
            <div className="child-dashboard__reward-count" aria-hidden="true">
              <BuddyIcon
                type={savedCharacterStyle}
                label={`${savedCharacterLabel} buddy`}
                decorative
              />
            </div>
          </div>
          <div className="child-dashboard__points-display" aria-label={`${pointsBalance} reward points`}>
            <strong>{pointsBalance}</strong>
            <span>points</span>
          </div>
          <Button as={Link} to="/rewards" variant="secondary">
            See Rewards
          </Button>
        </Card>

        <Card className="child-dashboard__style-card nf-enter-card nf-enter-card--5" variant="soft">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">Buddy</p>
              <h3>Pick a helper</h3>
            </div>
            <div className="child-dashboard__style-identity">
              <BuddyIcon type={savedCharacterStyle} label={`${savedCharacterLabel} buddy`} />
            </div>
          </div>

          <div className="child-dashboard__style-form">
            <div className="child-dashboard__buddy-grid" role="radiogroup" aria-label="Pick a helper">
              {characterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    option.value === characterStyle
                      ? "child-dashboard__buddy-option child-dashboard__buddy-option--active"
                      : "child-dashboard__buddy-option"
                  }
                  onClick={() => {
                    setCharacterStyle(option.value);
                    setPreferenceMessage("");
                  }}
                  role="radio"
                  aria-checked={option.value === characterStyle}
                >
                  <span aria-hidden="true">
                    <BuddyIcon type={option.value} label={`${option.label} buddy`} decorative />
                  </span>
                  <strong>{option.label}</strong>
                </button>
              ))}
            </div>

            {preferenceMessage ? (
              <p className="page-text child-dashboard__style-message">
                {preferenceMessage}
              </p>
            ) : null}

            <Button onClick={handleSavePreferences}>Keep This Buddy</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default ChildDashboard;
