import { NavLink, useNavigate } from "react-router-dom";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

function TopNav() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("current_user_id");
  const currentRole = String(localStorage.getItem("current_user_role") || "").toLowerCase();
  const currentName = localStorage.getItem("current_user_name");

  const childNavItems = [
    { to: "/child", label: "Child Dashboard" },
    { to: "/focus", label: "Focus" },
    { to: "/rewards", label: "Rewards" },
  ];

  const parentNavItems = [
    { to: "/parent", label: "Parent Dashboard" },
  ];

  const guestNavItems = [{ to: "/", label: "Home" }];

  const navItems = !isLoggedIn
    ? guestNavItems
    : currentRole === "parent"
    ? parentNavItems
    : childNavItems;

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
        <div className="brand-mark">
          <img src="/logo.png" alt="NeuroFlake logo" />
        </div>
        <div>
          <h1 className="brand-title">NeuroFlake</h1>
          <p className="brand-subtitle">Kind support for steady little wins</p>
        </div>
      </div>

      <nav className="nav-shell">
        <div className="nav-links">
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

        <div className="nav-actions">
          {isLoggedIn && currentName ? (
            <Badge tone={currentRole === "parent" ? "warm" : "mint"}>
              {currentRole === "parent" ? "Parent" : "Explorer"}: {currentName}
            </Badge>
          ) : (
            <Badge tone="default">Gentle task adventures</Badge>
          )}

          {!isLoggedIn && (
            <Button
              onClick={handleLogin}
              variant="secondary"
              size="sm"
            >
              Login
            </Button>
          )}

          {isLoggedIn && (
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
            >
              Logout
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default TopNav;
