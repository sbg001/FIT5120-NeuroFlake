function Badge({ children, tone = "default", className = "" }) {
  const classes = ["nf-badge", `nf-badge--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}

export default Badge;
