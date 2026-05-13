import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

function cleanCsvValue(value) {
  return String(value || "").trim().replace(/^"|"$/g, "");
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((header) => cleanCsvValue(header));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => cleanCsvValue(value));

    return headers.reduce((row, header, index) => {
      const rawValue = values[index] || "";
      const numberValue = Number(rawValue);
      row[header] =
        rawValue !== "" && !Number.isNaN(numberValue) ? numberValue : rawValue;
      return row;
    }, {});
  });
}

function DataIcon({ type }) {
  const icons = {
    school: (
      <>
        <path d="M3 9l9-5l9 5l-9 5l-9-5Z" />
        <path d="M7 11.5v4.2c0 1.2 2.2 2.3 5 2.3s5-1.1 5-2.3v-4.2" />
        <path d="M21 9v6" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3l9 16H3L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    support: (
      <>
        <path d="M12 21s-7-4.4-9.1-9.1C1.5 7.8 3.3 5 6.3 5c1.7 0 3.2.9 4 2.3C11.1 5.9 12.6 5 14.3 5c3 0 4.8 2.8 3.4 5.9C19 15.6 12 21 12 21Z" />
      </>
    ),
    communication: (
      <>
        <path d="M5 6.5h14a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-6l-4.5 3v-3H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" />
        <path d="M7 10h10" />
        <path d="M7 13h6" />
      </>
    ),
    learning: (
      <>
        <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
        <path d="M8 8h7" />
        <path d="M8 12h7" />
        <path d="M8 16h5" />
      </>
    ),
    social: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="9" r="3" />
        <path d="M3.5 20c.6-3.1 2.2-5 4.5-5s3.9 1.9 4.5 5" />
        <path d="M12 20c.6-2.6 2-4 4-4s3.4 1.4 4 4" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 21c.8-4.5 3.2-7 7-7s6.2 2.5 7 7" />
      </>
    ),
    routine: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M8 17h7" />
      </>
    ),
    steps: (
      <>
        <path d="M5 18h4v-4h4v-4h4V6h2" />
        <path d="M5 18h14" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M16 16l4 4" />
      </>
    ),
    star: (
      <>
        <path d="M12 3.5l2.5 5.1l5.6.8l-4 3.9l.9 5.6L12 16.2l-5 2.7l.9-5.6l-4-3.9l5.6-.8L12 3.5Z" />
      </>
    ),
  };

  return (
    <svg className="data-viz__svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type]}
    </svg>
  );
}

function findRow(rows, category) {
  return rows.find((row) => row.category === category) || {};
}

function getAutisticValue(row) {
  return Number(row["autistic_persons_(%)"] || 0);
}

function getNonAutisticValue(row) {
  return Number(row["non-autistic_persons_(%)"] || 0);
}

function DataVisualisation() {
  const [schoolingData, setSchoolingData] = useState([]);
  const [supportData, setSupportData] = useState([]);
  const [difficultyData, setDifficultyData] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadVisualisationData() {
      try {
        const [schoolingResponse, supportResponse, difficultyResponse] =
          await Promise.all([
            fetch("/data/schooling_restrictions.csv"),
            fetch("/data/support_types.csv"),
            fetch("/data/difficulty_types.csv"),
          ]);

        if (!schoolingResponse.ok || !supportResponse.ok || !difficultyResponse.ok) {
          setLoadError("Could not load visualisation datasets.");
          return;
        }

        const [schoolingText, supportText, difficultyText] = await Promise.all([
          schoolingResponse.text(),
          supportResponse.text(),
          difficultyResponse.text(),
        ]);

        setSchoolingData(parseCsv(schoolingText));
        setSupportData(parseCsv(supportText));
        setDifficultyData(parseCsv(difficultyText));
      } catch {
        setLoadError("Could not load visualisation datasets.");
      }
    }

    loadVisualisationData();
  }, []);

  const restrictionRow = findRow(schoolingData, "Total with educational restriction");
  const difficultyRow = findRow(difficultyData, "Total with difficulties(a)");
  const supportRow = findRow(supportData, "Total receiving support(b)");
  const assistanceRow = findRow(
    schoolingData,
    "Uses special assistance from a person at school"
  );

  const autisticRestriction = getAutisticValue(restrictionRow);
  const nonAutisticRestriction = getNonAutisticValue(restrictionRow);
  const autisticDifficulty = getAutisticValue(difficultyRow);
  const autisticSupport = getAutisticValue(supportRow);
  const autisticAssistance = getAutisticValue(assistanceRow);
  const restrictionGap = autisticRestriction - nonAutisticRestriction;

  const schoolComparisonData = useMemo(
    () => [
      {
        label: "Autistic students",
        value: autisticRestriction,
      },
      {
        label: "Non-autistic students",
        value: nonAutisticRestriction,
      },
    ],
    [autisticRestriction, nonAutisticRestriction]
  );

  const topDifficulties = useMemo(
    () =>
      difficultyData
        .filter((item) => {
          const label = String(item.category || "").toLowerCase();
          return !label.startsWith("total") && !label.startsWith("no ");
        })
        .sort((first, second) => getAutisticValue(second) - getAutisticValue(first))
        .slice(0, 4),
    [difficultyData]
  );

  const topSupports = useMemo(
    () =>
      supportData
        .filter((item) => {
          const label = String(item.category || "").toLowerCase();
          return !label.startsWith("total") && !label.startsWith("no ");
        })
        .sort((first, second) => getAutisticValue(second) - getAutisticValue(first))
        .slice(0, 4),
    [supportData]
  );

  const difficultyCards = topDifficulties.map((item) => {
    const iconMap = {
      "Fitting in socially": "social",
      "Communication difficulties": "communication",
      "Learning difficulties": "learning",
    };

    return {
      icon: iconMap[item.category] || "alert",
      label: item.category,
      value: getAutisticValue(item),
    };
  });

  const supportCards = topSupports.map((item) => {
    const iconMap = {
      "Special tuition": "learning",
      "Counsellor or disability support person": "person",
      "Special assessment procedure": "routine",
      "Other support": "support",
    };

    return {
      icon: iconMap[item.category] || "support",
      label: item.category,
      value: getAutisticValue(item),
    };
  });

  const maxComparisonValue = Math.max(
    1,
    ...schoolComparisonData.map((item) => item.value)
  );

  const maxDifficultyValue = Math.max(
    1,
    ...difficultyCards.map((item) => item.value)
  );

  const maxSupportValue = Math.max(
    1,
    ...supportCards.map((item) => item.value)
  );

  const evidenceCards = [
    {
      icon: "school",
      value: `${autisticRestriction.toFixed(0)}%`,
      label: "Educational restriction",
      text: "Many autistic students need extra support in school routines.",
    },
    {
      icon: "alert",
      value: `${autisticDifficulty.toFixed(0)}%`,
      label: "School difficulties",
      text: "Difficulties are practical barriers, not abstract concerns.",
    },
    {
      icon: "person",
      value: `${autisticAssistance.toFixed(0)}%`,
      label: "Personal assistance",
      text: "Support often depends on people, structure, and preparation.",
    },
  ];

  const neuroflakeResponses = [
    {
      icon: "steps",
      title: "Small steps",
      text: "Break hard tasks into clear actions.",
    },
    {
      icon: "routine",
      title: "Routines",
      text: "Keep daily support repeatable.",
    },
    {
      icon: "search",
      title: "Triggers",
      text: "Spot repeated stress patterns.",
    },
    {
      icon: "star",
      title: "Rewards",
      text: "Make progress visible.",
    },
  ];

  return (
    <section className="page-section data-visualisation-page">
      <PageHeader
        eyebrow="Data Insights"
        title="Why NeuroFlake Matters"
        description="School data shows clear support needs. NeuroFlake turns those needs into simple daily actions."
      />

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      <Card className="data-viz__landing-hero" variant="glow">
        <div className="data-viz__hero-icon" aria-hidden="true">
          <DataIcon type="school" />
        </div>

        <div className="data-viz__hero-main">
          <Badge tone="warm">Core problem</Badge>
          <h3>Support needs should be easier to see and manage.</h3>
          <p>
            Autistic students report higher school restrictions. Families need
            clear routines, smaller steps, and visible progress.
          </p>
        </div>

        <div className="data-viz__hero-number">
          <strong>{autisticRestriction.toFixed(0)}%</strong>
          <span>with educational restrictions</span>
        </div>
      </Card>

      <div className="data-viz__evidence-grid">
        {evidenceCards.map((item) => (
          <Card key={item.label} className="data-viz__evidence-card" variant="soft">
            <div className="data-viz__small-icon" aria-hidden="true">
              <DataIcon type={item.icon} />
            </div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.text}</p>
          </Card>
        ))}
      </div>

      <div className="data-viz__two-column">
        <Card className="data-viz__visual-card" variant="default">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">School gap</p>
              <h3>Educational restrictions are not equal</h3>
            </div>
            <Badge tone="sky">+{restrictionGap.toFixed(0)} pts</Badge>
          </div>

          <div className="data-viz__comparison-bars">
            {schoolComparisonData.map((item) => (
              <div key={item.label} className="data-viz__comparison-row">
                <div className="data-viz__bar-label-row">
                  <span>{item.label}</span>
                  <strong>{item.value.toFixed(0)}%</strong>
                </div>
                <div className="data-viz__bar-track">
                  <div
                    className="data-viz__bar-fill"
                    style={{
                      width: `${(item.value / maxComparisonValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="data-viz__chart-note">
            <strong>What this means</strong>
            <p>
              Families need a tool that makes support needs visible before daily
              tasks become overwhelming.
            </p>
          </div>
        </Card>

        <Card className="data-viz__visual-card" variant="glow">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">Main difficulties</p>
              <h3>What children struggle with</h3>
            </div>
            <Badge tone="warm">Top 4</Badge>
          </div>

          <div className="data-viz__compact-list">
            {difficultyCards.map((item) => (
              <div key={item.label} className="data-viz__compact-row">
                <div className="data-viz__compact-icon" aria-hidden="true">
                  <DataIcon type={item.icon} />
                </div>
                <div className="data-viz__compact-main">
                  <div className="data-viz__bar-label-row">
                    <span>{item.label}</span>
                    <strong>{item.value.toFixed(0)}%</strong>
                  </div>
                  <div className="data-viz__bar-track">
                    <div
                      className="data-viz__bar-fill"
                      style={{
                        width: `${(item.value / maxDifficultyValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="data-viz__chart-note">
            <strong>What this means</strong>
            <p>
              NeuroFlake should break complex situations into smaller, clearer actions.
            </p>
          </div>
        </Card>
      </div>

      <div className="data-viz__two-column">
        <Card className="data-viz__visual-card" variant="default">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">Support types</p>
              <h3>What support often looks like</h3>
            </div>
            <Badge tone="mint">Top 4</Badge>
          </div>

          <div className="data-viz__compact-list">
            {supportCards.map((item) => (
              <div key={item.label} className="data-viz__compact-row">
                <div className="data-viz__compact-icon" aria-hidden="true">
                  <DataIcon type={item.icon} />
                </div>
                <div className="data-viz__compact-main">
                  <div className="data-viz__bar-label-row">
                    <span>{item.label}</span>
                    <strong>{item.value.toFixed(0)}%</strong>
                  </div>
                  <div className="data-viz__bar-track">
                    <div
                      className="data-viz__bar-fill"
                      style={{
                        width: `${(item.value / maxSupportValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="data-viz__chart-note">
            <strong>What this means</strong>
            <p>
              School support exists, but families still need home routines that
              connect with that support.
            </p>
          </div>
        </Card>

        <Card className="data-viz__visual-card data-viz__bridge-card" variant="soft">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">Design decision</p>
              <h3>Why this becomes a web app</h3>
            </div>
            <Badge tone="warm">Problem → product</Badge>
          </div>

          <div className="data-viz__bridge-list">
            <div>
              <DataIcon type="alert" />
              <span>School difficulties are hard to track day by day.</span>
            </div>
            <div>
              <DataIcon type="routine" />
              <span>Parents need repeatable routines, not one-time advice.</span>
            </div>
            <div>
              <DataIcon type="steps" />
              <span>Children need tasks presented one step at a time.</span>
            </div>
            <div>
              <DataIcon type="star" />
              <span>Visible progress helps motivation and confidence.</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="data-viz__solution-card" variant="glow">
        <div className="data-viz__solution-header">
          <div>
            <p className="eyebrow">NeuroFlake response</p>
            <h3>From school needs to daily support</h3>
          </div>
          <Badge tone="mint">Product response</Badge>
        </div>

        <div className="data-viz__solution-grid">
          {neuroflakeResponses.map((item) => (
            <div key={item.title}>
              <span aria-hidden="true">
                <DataIcon type={item.icon} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export default DataVisualisation;