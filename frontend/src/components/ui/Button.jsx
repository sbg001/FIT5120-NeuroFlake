import { createElement } from "react";

function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = ["nf-button", `nf-button--${variant}`, `nf-button--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return createElement(
    Component,
    { className: classes, ...props },
    children
  );
}

export default Button;
