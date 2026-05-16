import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import BuddyIcon from "../components/ui/BuddyIcon";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import OpenMojiIcon from "../components/ui/OpenMojiIcon";
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
  const [showAllQuests, setShowAllQuests] = useState(false);
  const [questPage, setQuestPage] = useState(1);
  const [showBuddyPicker, setShowBuddyPicker] = useState(false);

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
  const completedCount = completedTasks.length;
  const pointsBalance = points?.points_balance ?? 0;
  const totalQuestCount = childTasks.length;
  const allQuestTasks = [...readyTasks, ...completedTasks];
  const questPageSize = 3;
  const totalQuestPages = Math.max(1, Math.ceil(allQuestTasks.length / questPageSize));
  const currentQuestPage = Math.min(questPage, totalQuestPages);
  const visibleQuestTasks = allQuestTasks.slice(
    (currentQuestPage - 1) * questPageSize,
    currentQuestPage * questPageSize
  );

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

  const getQuestStatus = (task) => {
    const completed =
      task.status === "completed" ||
      Number(task.completed_steps || 0) >= Number(task.total_steps || 0);

    if (completed) {
      return {
        label: "Completed",
        icon: "check",
        tone: "mint",
        className: "child-dashboard__quest-card--completed",
        message: "Great job!",
      };
    }

    if (Number(task.completed_steps || 0) > 0) {
      return {
        label: "In progress",
        icon: "hourglass",
        tone: "sky",
        className: "child-dashboard__quest-card--active",
        message: "One step at a time!",
      };
    }

    return {
      label: "Not started",
      icon: "sparkles",
      tone: "warm",
      className: "child-dashboard__quest-card--new",
      message: "Ready when you are.",
    };
  };

  return (
    <section className="page-section child-dashboard child-dashboard--quest-hub">
      <Card className="child-dashboard__greeting-card nf-enter-card nf-enter-card--1" variant="glow">
        <div>
          <p className="eyebrow child-dashboard__eyebrow-icon">
            <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
              <OpenMojiIcon name="sparkles" />
            </span>
            Today
          </p>
          <h2>
            <span className="child-dashboard__heading-openmoji" aria-hidden="true">
              <OpenMojiIcon name="compass" />
            </span>
            Hi {displayName}, your quest hub is ready.
          </h2>
          <p className="page-text">Pick one quest. Your buddy will stay with you.</p>
        </div>
        <div className="child-dashboard__intro-pills" aria-label="Today summary">
          <Badge tone="warm" className="child-dashboard__status-badge">
            <span className="child-dashboard__status-openmoji" aria-hidden="true">
              <OpenMojiIcon name="sparkles" />
            </span>
            <span>{readyTasks.length} ready</span>
          </Badge>
          <Badge tone="mint" className="child-dashboard__status-badge">
            <span className="child-dashboard__status-openmoji" aria-hidden="true">
              <OpenMojiIcon name="check" />
            </span>
            <span>{completedCount} done</span>
          </Badge>
        </div>
      </Card>

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      <div className="child-dashboard__board">
        <Card className="child-dashboard__focus-card nf-enter-card nf-enter-card--1" variant="glow">
          <div className="child-dashboard__focus-head">
            <div>
              <p className="eyebrow child-dashboard__eyebrow-icon">
                <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="compass" />
                </span>
                Start quest
              </p>
              <h3 className="child-dashboard__mission-title">
                {featuredTask ? featuredTask.title : "Nothing to do right now"}
              </h3>
              <p className="child-dashboard__mission-copy">
                {featuredTask ? getQuestStatus(featuredTask).message : "You can visit rewards or rest for now."}
              </p>
            </div>
            <div className="child-dashboard__focus-side">
              <div className="child-dashboard__focus-buddy" aria-hidden="true">
                <BuddyIcon
                  type={savedCharacterStyle}
                  label={`${savedCharacterLabel} buddy`}
                  decorative
                />
              </div>
              {featuredTask ? (
                <Badge tone={getQuestStatus(featuredTask).tone} className="child-dashboard__status-badge">
                  <span className="child-dashboard__status-openmoji" aria-hidden="true">
                    <OpenMojiIcon name={getQuestStatus(featuredTask).icon} />
                  </span>
                  <span>{getQuestStatus(featuredTask).label}</span>
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
                    {getQuestStatus(featuredTask).label}
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
                  {getQuestStatus(featuredTask).label === "Completed" ? "Look Back" : "Start Quest"}
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

        {showAllQuests ? (
        <Card className="child-dashboard__missions-list nf-enter-card nf-enter-card--3" variant="default">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow child-dashboard__eyebrow-icon">
                <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="memo" />
                </span>
                Quests
              </p>
              <h3 className="child-dashboard__section-title">
                <span className="child-dashboard__section-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="books" />
                </span>
                Today&apos;s quests
              </h3>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAllQuests(false)}>
              Hide
            </Button>
          </div>

          <div className="child-dashboard__mini-missions">
            {visibleQuestTasks.map((task) => {
              const status = getQuestStatus(task);
              const totalSteps = Math.max(Number(task.total_steps || 0), 1);
              const doneSteps = Math.min(Number(task.completed_steps || 0), totalSteps);

              return (
              <div
                key={task.task_id}
                className={`child-dashboard__mini-mission child-dashboard__quest-card ${status.className}`}
              >
                <div className="child-dashboard__quest-main">
                  <h4>
                    <BuddyIcon
                      type={savedCharacterStyle}
                      label=""
                      decorative
                      className="child-dashboard__mini-mission-icon"
                    />
                    {task.title}
                  </h4>
                  <p>{status.message}</p>
                  <ProgressBar value={doneSteps} max={totalSteps} label={`${task.title} quest progress`} />
                </div>
                <div className="child-dashboard__quest-actions">
                  <Badge tone={status.tone} className="child-dashboard__status-badge">
                    <span className="child-dashboard__status-openmoji" aria-hidden="true">
                      <OpenMojiIcon name={status.icon} />
                    </span>
                    <span>{status.label}</span>
                  </Badge>
                  <Button as={Link} to={`/tasks/${task.task_id}`} variant="secondary" size="sm">
                    {status.label === "Completed" ? "View" : "Start"}
                  </Button>
                </div>
              </div>
              );
            })}

            {allQuestTasks.length === 0 ? (
              <div className="child-dashboard__empty-state">
                <span className="child-dashboard__empty-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="herb" />
                </span>
                <p className="page-text">
                  No quests right now. Nice and calm.
                </p>
              </div>
            ) : null}

            {allQuestTasks.length > questPageSize ? (
              <div className="child-dashboard__pagination" aria-label="Quest pages">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentQuestPage === 1}
                  onClick={() => setQuestPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page {currentQuestPage} of {totalQuestPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentQuestPage === totalQuestPages}
                  onClick={() =>
                    setQuestPage((page) => Math.min(totalQuestPages, page + 1))
                  }
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
        ) : (
          <Card className="child-dashboard__collapsed-card nf-enter-card nf-enter-card--3" variant="soft">
            <div>
              <p className="eyebrow child-dashboard__eyebrow-icon">
                <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="memo" />
                </span>
                Quests
              </p>
              <h3 className="child-dashboard__section-title">
                <span className="child-dashboard__section-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="books" />
                </span>
                {readyTasks.length} ready, {completedCount} done
              </h3>
              <p className="page-text">Only open this if you want to see everything.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuestPage(1);
                setShowAllQuests(true);
              }}
            >
              See All Quests
            </Button>
          </Card>
        )}

        <Card className="child-dashboard__reward-card nf-enter-card nf-enter-card--4" variant="soft">
          <div className="child-dashboard__reward-head">
            <div>
              <p className="eyebrow child-dashboard__eyebrow-icon">
                <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="gift" />
                </span>
                Treasure jar
              </p>
              <h3 className="child-dashboard__section-title">
                <span className="child-dashboard__section-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="star" />
                </span>
                Your quest stars
              </h3>
            </div>
            <div className="child-dashboard__reward-count" aria-hidden="true">
              <OpenMojiIcon name="star" />
            </div>
          </div>
          <div className="child-dashboard__treasure-jar" aria-label={`${pointsBalance} star points`}>
            <div className="child-dashboard__jar-glow" aria-hidden="true" />
            <div className="child-dashboard__jar-stars" aria-hidden="true">
              {Array.from({ length: Math.min(Math.max(pointsBalance, 3), 9) }).map((_, index) => (
                <span key={index}>
                  <OpenMojiIcon name="star" />
                </span>
              ))}
            </div>
            <div className="child-dashboard__jar-label">
              <strong>{pointsBalance}</strong>
              <span>quest stars</span>
            </div>
          </div>
          <Button as={Link} to="/rewards" variant="secondary">
            Open Rewards
          </Button>
        </Card>

        <Card className="child-dashboard__style-card nf-enter-card nf-enter-card--5" variant="soft">
          <div className="child-dashboard__buddy-panel">
            <div>
              <p className="eyebrow child-dashboard__eyebrow-icon">
                <span className="child-dashboard__tiny-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="herb" />
                </span>
                AI Buddy
              </p>
              <h3 className="child-dashboard__section-title">
                <span className="child-dashboard__section-openmoji" aria-hidden="true">
                  <OpenMojiIcon name="speech" />
                </span>
                {savedCharacterLabel} is here
              </h3>
            </div>
            <div className="child-dashboard__style-identity">
              <BuddyIcon type={savedCharacterStyle} label={`${savedCharacterLabel} buddy`} />
            </div>
          </div>

          {showBuddyPicker ? (
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

            <div className="child-dashboard__focus-action-row">
              <Button onClick={handleSavePreferences}>Keep This Buddy</Button>
              <Button type="button" variant="secondary" onClick={() => setShowBuddyPicker(false)}>
                Close
              </Button>
            </div>
          </div>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setShowBuddyPicker(true)}>
              Change Buddy
            </Button>
          )}
        </Card>
      </div>
    </section>
  );
}

export default ChildDashboard;
