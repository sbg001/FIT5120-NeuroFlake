import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
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

  const [theme, setTheme] = useState("fun");
  const [characterStyle, setCharacterStyle] = useState("star");
  const [rewardInterest, setRewardInterest] = useState("games");
  const [preferenceMessage, setPreferenceMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: childData } = await getChildProfile();
      const { data: tasksData } = await getTasks();
      const { data: pointsData } = await getPointsBalance(childData?.user_id);
      const { data: preferenceData } = await getChildPreferences();

      setChild(childData);
      setTasks(tasksData || []);
      setPoints(pointsData);

      if (preferenceData) {
        setTheme(preferenceData.theme || "fun");
        setCharacterStyle(preferenceData.character_style || "star");
        setRewardInterest(preferenceData.reward_interest || "games");
      }
    }

    loadData();
  }, []);

  const handleSavePreferences = async () => {
    setPreferenceMessage("");

    const result = await upsertChildPreferences({
      child_id: child?.user_id,
      theme,
      character_style: characterStyle,
      reward_interest: rewardInterest,
    });

    if (result.error) {
      setPreferenceMessage("Could not save your style picks yet.");
      return;
    }

    setPreferenceMessage("Your mission style is ready.");
    window.dispatchEvent(new Event("preferencesUpdated"));
  };

  if (!child) {
    return <p className="page-text">Loading dashboard...</p>;
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
  const totalTasks = childTasks.length;
  const completedCount = completedTasks.length;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const pointsBalance = points?.points_balance ?? 0;
  const ageDisplay =
    child.age ?? child.child_age ?? child.profile_age ?? "Not set";

  const characterMap = {
    star: "\u2B50",
    rocket: "\u{1F680}",
    bear: "\u{1F9F8}",
    cat: "\u{1F431}",
    dog: "\u{1F436}",
    fox: "\u{1F98A}",
  };

  const themeLabelMap = {
    fun: "Fun",
    space: "Space",
    animals: "Animals",
    food: "Food",
  };

  const rewardInterestLabelMap = {
    games: "Games",
    food: "Food",
    toys: "Toys",
    "screen-time": "Screen Time",
  };

  const currentCharacter = characterMap[characterStyle] || "\u2B50";
  const currentThemeLabel = themeLabelMap[theme] || theme;
  const currentRewardInterestLabel =
    rewardInterestLabelMap[rewardInterest] || rewardInterest;

  const achievementCards = [
    {
      id: "points",
      emoji: "\u2728",
      title: "Spark Points",
      text: `${pointsBalance} bright points collected`,
      tone: "sky",
    },
    {
      id: "missions",
      emoji: "\u{1F3AF}",
      title: "Mission Progress",
      text:
        totalTasks > 0
          ? `${completedCount} of ${totalTasks} missions finished`
          : "Your first mission can start today",
      tone: "mint",
    },
    {
      id: "style",
      emoji: currentCharacter,
      title: "Adventure Style",
      text: `${currentThemeLabel} world with ${currentRewardInterestLabel.toLowerCase()} rewards`,
      tone: "warm",
    },
  ];

  const missionMessage = featuredTask
    ? featuredTask.status === "completed"
      ? "You already finished this mission. Want to look at your great work?"
      : "Your next mission is ready. Let's take one gentle step at a time."
    : "No missions waiting right now. That means you can rest or celebrate.";

  const featuredProgressValue = featuredTask
    ? Number(featuredTask.completed_steps || 0)
    : 0;
  const featuredProgressMax = featuredTask
    ? Math.max(Number(featuredTask.total_steps || 0), 1)
    : 1;

  return (
    <section className="page-section child-dashboard">
      <PageHeader
        eyebrow="Mission Dashboard"
        title={`Hi ${displayName}, ready for your next small win?`}
        description="This is your calm mission board. You can see your next step, your progress, and the good things you have already earned."
      />

      <div className="child-dashboard__hero-grid">
        <Card className="child-dashboard__welcome nf-enter-card nf-enter-card--1" variant="glow">
          <div className="child-dashboard__welcome-copy">
            <div className="child-dashboard__welcome-top">
              <Badge tone="mint">Mission buddy online</Badge>
              <Badge tone="sky">Age {ageDisplay}</Badge>
            </div>

            <div className="child-dashboard__mascot-row">
              <div className="child-dashboard__mascot">{currentCharacter}</div>
              <div>
                <h3 className="child-dashboard__hero-title">Welcome back, {displayName}</h3>
                <p className="page-text">
                  {readyTasks.length > 0
                    ? `${readyTasks.length} mission${readyTasks.length === 1 ? "" : "s"} ready for today.`
                    : "You have a calm, clear board today."}
                </p>
              </div>
            </div>

            <div className="child-dashboard__hero-pills">
              <span>Theme: {currentThemeLabel}</span>
              <span>Reward style: {currentRewardInterestLabel}</span>
              <span>Points: {pointsBalance}</span>
            </div>
          </div>
        </Card>

        <Card className="child-dashboard__points-card nf-enter-card nf-enter-card--2" variant="soft">
          <p className="eyebrow">Reward Energy</p>
          <div className="child-dashboard__points-value">{pointsBalance}</div>
          <p className="page-text">Every finished step helps your point jar grow.</p>
          <div className="child-dashboard__points-stars" aria-hidden="true">
            <span>{"\u2B50"}</span>
            <span>{"\u2728"}</span>
            <span>{"\u2B50"}</span>
          </div>
        </Card>
      </div>

      <div className="child-dashboard__main-grid">
        <Card className="child-dashboard__mission-card nf-enter-card nf-enter-card--3" variant="glow">
          <div className="child-dashboard__mission-header">
            <div>
              <p className="eyebrow">Today's Mission</p>
              <h3 className="child-dashboard__mission-title">
                {featuredTask ? featuredTask.title : "Mission time can be calm today"}
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
                    {featuredTask.completed_steps} of {featuredTask.total_steps} steps finished
                  </span>
                  <span>
                    {featuredTask.status === "completed" ? "Completed" : "In progress"}
                  </span>
                </div>
                <ProgressBar
                  value={featuredProgressValue}
                  max={featuredProgressMax}
                  label="Featured mission progress"
                />
              </div>

              <div className="child-dashboard__mission-actions">
                <Button as={Link} to={`/tasks/${featuredTask.task_id}`}>
                  {featuredTask.status === "completed" ? "See Mission" : "Start Task"}
                </Button>
                <p className="page-text">{missionMessage}</p>
              </div>
            </>
          ) : (
            <div className="child-dashboard__mission-actions">
              <Button as={Link} to="/rewards" variant="secondary">
                Visit Rewards
              </Button>
              <p className="page-text">You can check your points or just enjoy the quiet moment.</p>
            </div>
          )}
        </Card>

        <div className="child-dashboard__side-column">
          <Card className="child-dashboard__progress-card nf-enter-card nf-enter-card--4" variant="soft">
            <p className="eyebrow">Progress Overview</p>
            <div className="child-dashboard__stat-list">
              <div className="child-dashboard__stat-item">
                <strong>{readyTasks.length}</strong>
                <span>ready now</span>
              </div>
              <div className="child-dashboard__stat-item">
                <strong>{completedCount}</strong>
                <span>done already</span>
              </div>
              <div className="child-dashboard__stat-item">
                <strong>{completionPercent}%</strong>
                <span>mission map complete</span>
              </div>
            </div>
            <ProgressBar
              value={completionPercent}
              max={100}
              label="Overall mission progress"
            />
          </Card>

          <Card className="child-dashboard__achievements-card nf-enter-card nf-enter-card--5" variant="soft">
            <p className="eyebrow">Achievement Cards</p>
            <div className="child-dashboard__achievements-grid">
              {achievementCards.map((achievement) => (
                <div key={achievement.id} className="child-dashboard__achievement-tile">
                  <Badge tone={achievement.tone}>{achievement.title}</Badge>
                  <div className="child-dashboard__achievement-emoji">{achievement.emoji}</div>
                  <p>{achievement.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="child-dashboard__bottom-grid">
        <Card className="child-dashboard__missions-list nf-enter-card nf-enter-card--6" variant="default">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">More Missions</p>
              <h3>Pick another calm mission</h3>
            </div>
            <Badge tone="sky">
              {readyTasks.length > 1 ? `${readyTasks.length - 1} extra ready` : "One at a time"}
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
                    {task.completed_steps} / {task.total_steps} steps complete
                  </p>
                </div>
                <Button as={Link} to={`/tasks/${task.task_id}`} variant="secondary" size="sm">
                  {task.status === "completed" ? "View" : "Start"}
                </Button>
              </div>
            ))}

            {extraTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="page-text">
                No extra missions yet. Your board is nice and clear.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="child-dashboard__style-card nf-enter-card nf-enter-card--7" variant="soft">
          <div className="child-dashboard__section-row">
            <div>
              <p className="eyebrow">Mission Style</p>
              <h3>Make the board feel like yours</h3>
            </div>
            <div className="child-dashboard__style-identity">{currentCharacter}</div>
          </div>

          <div className="child-dashboard__style-form">
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="fun">Fun Theme</option>
              <option value="space">Space Theme</option>
              <option value="animals">Animals Theme</option>
              <option value="food">Food Theme</option>
            </select>

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

            <select
              value={rewardInterest}
              onChange={(e) => setRewardInterest(e.target.value)}
            >
              <option value="games">Games</option>
              <option value="food">Food</option>
              <option value="toys">Toys</option>
              <option value="screen-time">Screen Time</option>
            </select>

            {preferenceMessage ? (
              <p className="page-text child-dashboard__style-message">
                {preferenceMessage}
              </p>
            ) : null}

            <Button onClick={handleSavePreferences}>Save My Mission Style</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default ChildDashboard;
