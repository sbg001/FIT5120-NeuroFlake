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
      row[header] = rawValue !== "" && !Number.isNaN(numberValue) ? numberValue : rawValue;
      return row;
    }, {});
  });
}

function DataIcon({ type }) {
  const icons = {
    puzzle: (
      <>
        <path d="M10 3H7.5A2.5 2.5 0 0 0 5 5.5V9H3.5A1.5 1.5 0 0 0 2 10.5v3A1.5 1.5 0 0 0 3.5 15H5v3.5A2.5 2.5 0 0 0 7.5 21H11v-2a2 2 0 1 1 4 0v2h1.5A2.5 2.5 0 0 0 19 18.5V15h1.5A1.5 1.5 0 0 0 22 13.5v-3A1.5 1.5 0 0 0 20.5 9H19V5.5A2.5 2.5 0 0 0 16.5 3H14v2a2 2 0 1 1-4 0V3Z" />
      </>
    ),
    leaf: (
      <>
        <path d="M20.5 3.5C13 3.8 6.8 7.2 4.4 12.1C2.8 15.3 4.5 19 8.1 20.1C13.4 21.8 19.6 16.6 20.5 3.5Z" />
        <path d="M5.5 18.5C8.2 13.9 11.8 10.7 16.5 8.4" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5L13.4 13.4L8.5 15.5L10.6 10.6L15.5 8.5Z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
        <path d="M8 14h2" />
        <path d="M13 14h3" />
        <path d="M8 17h5" />
      </>
    ),
    heart: (
      <>
        <path d="M12 20s-7-4.4-9.1-9.1C1.5 7.8 3.3 5 6.3 5c1.7 0 3.2.9 4 2.3C11.1 5.9 12.6 5 14.3 5c3 0 4.8 2.8 3.4 5.9C19 15.6 12 20 12 20Z" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.3l2.4 2.4L16.5 8.5" />
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
    <svg
      className="data-viz__svg-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  );
}

function DataVisualisation() {
  const [careHoursData, setCareHoursData] = useState([]);
  const [careReasonsData, setCareReasonsData] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadVisualisationData() {
      try {
        const [hoursResponse, reasonsResponse] = await Promise.all([
          fetch("/data/care_hours_stats.csv"),
          fetch("/data/care_reasons_stats.csv"),
        ]);

        if (!hoursResponse.ok || !reasonsResponse.ok) {
          setLoadError("Could not load visualisation datasets.");
          return;
        }

        const [hoursText, reasonsText] = await Promise.all([
          hoursResponse.text(),
          reasonsResponse.text(),
        ]);

        setCareHoursData(parseCsv(hoursText));
        setCareReasonsData(parseCsv(reasonsText));
      } catch {
        setLoadError("Could not load visualisation datasets.");
      }
    }

    loadVisualisationData();
  }, []);

  const careHours = careHoursData[0] || {};

  const weeklyHoursData = useMemo(
    () => [
      {
        icon: "leaf",
        label: "Less than 20h",
        value: Number(careHours.weekly_less_than_20 || 0),
      },
      {
        icon: "compass",
        label: "20–39h",
        value: Number(careHours.weekly_20_39 || 0),
      },
      {
        icon: "clock",
        label: "40h+",
        value: Number(careHours.weekly_40_or_more || 0),
      },
    ],
    [careHours]
  );

  const careDurationData = useMemo(
    () => [
      {
        label: "<2y",
        value: Number(careHours.yearly_less_than_2 || 0),
      },
      {
        label: "2–4y",
        value: Number(careHours.yearly_2_4 || 0),
      },
      {
        label: "5–9y",
        value: Number(careHours.yearly_5_9 || 0),
      },
      {
        label: "10–24y",
        value: Number(careHours.yearly_10_24 || 0),
      },
      {
        label: "25y+",
        value: Number(careHours.yearly_25_or_more || 0),
      },
    ],
    [careHours]
  );

  const topReasons = [...careReasonsData]
    .sort(
      (first, second) =>
        Number(second.parent_percentage || 0) - Number(first.parent_percentage || 0)
    )
    .slice(0, 3);

  const highCareHours = Number(careHours.weekly_40_or_more || 0);
  const longTermCare =
    Number(careHours.yearly_10_24 || 0) + Number(careHours.yearly_25_or_more || 0);

  const maxDurationValue = Math.max(1, ...careDurationData.map((item) => item.value));
  const maxReasonValue = Math.max(
    1,
    ...topReasons.map((reason) => Number(reason.parent_percentage || 0))
  );

  return (
    <section className="page-section data-visualisation-page">
      <PageHeader
        eyebrow="Data Insights"
        title="Why NeuroFlake Matters"
        description="Caregiving data shows why families need simple routines, gentle prompts, and visible progress."
      />

      {loadError ? (
        <Card className="content-card" variant="soft">
          <p className="page-text">{loadError}</p>
        </Card>
      ) : null}

      <Card className="data-viz__landing-hero" variant="glow">
        <div className="data-viz__hero-icon" aria-hidden="true">
          <DataIcon type="puzzle" />
        </div>

        <div className="data-viz__hero-main">
          <h3>Parent support should reduce pressure, not add more work.</h3>
        </div>

        <div className="data-viz__hero-number">
          <strong>{highCareHours.toFixed(1)}%</strong>
          <span>provide 40+ hours of care each week</span>
        </div>
      </Card>

      <div className="data-viz__stat-grid">
        {weeklyHoursData.map((item) => (
          <Card key={item.label} className="data-viz__stat-card" variant="soft">
            <div className="data-viz__stat-icon" aria-hidden="true">
              <DataIcon type={item.icon} />
            </div>
            <strong>{item.value.toFixed(1)}%</strong>
            <span>{item.label} weekly care</span>
          </Card>
        ))}
      </div>

      <div className="data-viz__story-grid">
        <Card className="data-viz__visual-card" variant="default">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">Long-term care</p>
              <h3>{longTermCare.toFixed(1)}% provide care for 10+ years</h3>
            </div>
            <div className="data-viz__mini-icon" aria-hidden="true">
              <DataIcon type="calendar" />
            </div>
          </div>

          <div className="data-viz__column-chart">
            {careDurationData.map((item) => (
              <div key={item.label} className="data-viz__column-item">
                <div className="data-viz__column-track">
                  <div
                    className="data-viz__column-fill"
                    style={{ height: `${(item.value / maxDurationValue) * 100}%` }}
                  />
                </div>
                <strong>{item.value.toFixed(1)}%</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="data-viz__visual-card" variant="glow">
          <div className="data-viz__mini-header">
            <div>
              <p className="eyebrow">Why parents care</p>
              <h3>Care is personal, not just practical</h3>
            </div>
            <div className="data-viz__mini-icon" aria-hidden="true">
              <DataIcon type="heart" />
            </div>
          </div>

          <div className="data-viz__reason-stack">
            {topReasons.map((reason, index) => (
              <div key={reason.reason} className="data-viz__reason-pill">
                <div className="data-viz__reason-rank">{index + 1}</div>
                <span>{reason.reason}</span>
                <strong>{Number(reason.parent_percentage || 0).toFixed(1)}%</strong>
                <div className="data-viz__bar-track">
                  <div
                    className="data-viz__bar-fill"
                    style={{
                      width: `${
                        (Number(reason.parent_percentage || 0) / maxReasonValue) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="data-viz__solution-card" variant="soft">
        <div className="data-viz__solution-header">
          <div>
            <p className="eyebrow">NeuroFlake response</p>
            <h3>Simple support for daily family routines</h3>
          </div>
          <Badge tone="mint">Designed from the data</Badge>
        </div>

        <div className="data-viz__solution-grid">
          <div>
            <span aria-hidden="true">
              <DataIcon type="check" />
            </span>
            <strong>Small steps</strong>
            <p>Break tasks into child-friendly actions.</p>
          </div>
          <div>
            <span aria-hidden="true">
              <DataIcon type="routine" />
            </span>
            <strong>Routines</strong>
            <p>Help parents plan without starting over.</p>
          </div>
          <div>
            <span aria-hidden="true">
              <DataIcon type="search" />
            </span>
            <strong>Triggers</strong>
            <p>Notice repeated stress patterns early.</p>
          </div>
          <div>
            <span aria-hidden="true">
              <DataIcon type="star" />
            </span>
            <strong>Rewards</strong>
            <p>Make progress visible and encouraging.</p>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default DataVisualisation;