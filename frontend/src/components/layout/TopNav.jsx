import { NavLink } from "react-router-dom";

function TopNav() {
  const navItems = [
    { to: "/", label: "Home" },
    { to: "/child", label: "Child" },
    { to: "/tasks", label: "Tasks" },
    { to: "/focus", label: "Focus" },
    { to: "/rewards", label: "Rewards" },
    { to: "/parent", label: "Parent" },
  ];

  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-mark">N</div>
        <div>
          <h1 className="brand-title">NeuroFlake</h1>
          <p className="brand-subtitle">Building Connections that Last</p>
        </div>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active-link" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default TopNav;