import { NavLink, useNavigate } from "react-router-dom";

// Accept the onOpenAssistant prop passed down from AppLayout
function TopNav({ onOpenAssistant }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("current_user_id");

  const navItems = [
    { to: "/home", label: "Home" },
    { to: "/child", label: "Child" },
    { to: "/tasks/a1111111-1111-1111-1111-111111111111", label: "Tasks" },
    { to: "/focus", label: "Focus" },
    { to: "/rewards", label: "Rewards" },
    { to: "/parent", label: "Parent" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("current_user_id");
    localStorage.removeItem("current_user_role");
    localStorage.removeItem("current_user_name");
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-mark">N</div>
        <div>
          <h1 className="brand-title">NeuroFlake</h1>
          <p className="brand-subtitle">Building Connections that Last</p>
        </div>
      </div>

      <nav
        className="nav-links"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={onOpenAssistant}
            className="primary-button"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Task Help
          </button>

          {!isLoggedIn && (
            <button
              onClick={handleLogin}
              className="secondary-button"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
              }}
            >
              Login
            </button>
          )}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="secondary-button"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default TopNav;