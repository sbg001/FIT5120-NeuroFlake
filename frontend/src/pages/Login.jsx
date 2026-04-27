import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { getUsers, loginWithPin } from "../services";

function Login() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUsers() {
      const { data } = await getUsers();
      setUsers(data || []);
    }

    loadUsers();
  }, []);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!selectedUserId || !pinCode) {
      setErrorMessage("Choose a profile and enter the PIN.");
      return;
    }

    setIsLoading(true);
    const result = await loginWithPin(selectedUserId, pinCode);
    setIsLoading(false);

    if (result.error) {
      setErrorMessage("That PIN did not work. Please try again.");
      return;
    }

    const user = result.data;

    localStorage.setItem("current_user_id", user.user_id);
    localStorage.setItem("current_user_role", user.role);
    localStorage.setItem("current_user_name", user.name);

    if (user.role === "parent") {
      navigate("/parent");
    } else {
      navigate("/child");
    }
  };

  const selectedUser =
    users.find((user) => String(user.user_id) === String(selectedUserId)) ||
    null;

  return (
    <section className="login-page">
      <div className="login-visual" aria-hidden="true">
        <img src="/logo.png" alt="" />
        <div className="login-visual-card">
          <p>One routine</p>
          <strong>One step</strong>
          <span>One calm start</span>
        </div>
      </div>

      <Card className="login-card" variant="glow">
        <div className="login-header">
          <PageHeader
            eyebrow="Login"
            title="Choose your profile"
            description="Use your private PIN to step into your calm routine space."
          />
        </div>

        <div className="login-profile-grid">
          {users.map((user) => {
            const isSelected = String(user.user_id) === String(selectedUserId);
            const roleLabel =
              String(user.role).toLowerCase() === "parent"
                ? "Parent"
                : "Child";

            return (
              <button
                key={user.user_id}
                type="button"
                className={
                  isSelected
                    ? "login-profile-button is-selected"
                    : "login-profile-button"
                }
                onClick={() => {
                  setSelectedUserId(user.user_id);
                  setErrorMessage("");
                }}
              >
                <span>{roleLabel.slice(0, 1)}</span>
                <strong>{roleLabel} Profile</strong>
                <small>{user.name}</small>
              </button>
            );
          })}
        </div>

        <div className="login-demo-pin-box">
          <strong>Iteration demo access</strong>
          <p>Parent PIN: 2222</p>
          <p>Child PIN: 1111</p>
        </div>

        <div className="login-form">
          <label htmlFor="pin-code">
            PIN
            {selectedUser && <span>{selectedUser.role} profile selected</span>}
          </label>

          <input
            id="pin-code"
            type="password"
            value={pinCode}
            onChange={(e) => {
              setPinCode(e.target.value);
              setErrorMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleLogin();
              }
            }}
            placeholder="Enter PIN"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
          />

          {errorMessage && (
            <div className="login-error" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Continue"}
          </Button>

          <Button as={Link} to="/" variant="secondary" className="login-home-button">
            Back to Home
          </Button>

          <p className="login-note">
            PINs stay hidden on this page. Ask a parent or caregiver if you need help.
          </p>
        </div>
      </Card>
    </section>
  );
}

export default Login;
