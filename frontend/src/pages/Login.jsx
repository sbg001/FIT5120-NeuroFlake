import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

      <div className="login-card">
        <div className="login-header">
          <p className="eyebrow">Login</p>
          <h1>Choose your profile</h1>
          <p>Use your private PIN to continue.</p>
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
          <p>Child PIN: 1111</p>
          <p>Parent PIN: 2222</p>
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

          <button
            onClick={handleLogin}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Continue"}
          </button>

          <Link to="/" className="secondary-button login-home-button">
            Back to Home
          </Link>

          <p className="login-note">
            PINs stay hidden on this page. Ask a parent or caregiver if you need help.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
