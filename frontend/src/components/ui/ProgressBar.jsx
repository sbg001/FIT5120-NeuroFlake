function ProgressBar({
  value = 0,
  max = 100,
  label = "Progress",
  className = "",
}) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percent = (safeValue / safeMax) * 100;

  return (
    <div
      className={["nf-progress", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
    >
      <div className="nf-progress__track">
        <div className="nf-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
