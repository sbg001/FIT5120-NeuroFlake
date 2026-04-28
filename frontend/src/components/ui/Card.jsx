import { createElement } from "react";

function Card({
  as: Component = "section",
  className = "",
  variant = "default",
  children,
  ...props
}) {
  const classes = ["nf-card", `nf-card--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return createElement(
    Component,
    { className: classes, ...props },
    children
  );
}

export default Card;
