function PageHeader({
  eyebrow,
  title,
  description,
  actions = null,
  className = "",
}) {
  return (
    <header className={["nf-page-header", className].filter(Boolean).join(" ")}>
      <div className="nf-page-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="page-title">{title}</h2> : null}
        {description ? <p className="page-text">{description}</p> : null}
      </div>
      {actions ? <div className="nf-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
