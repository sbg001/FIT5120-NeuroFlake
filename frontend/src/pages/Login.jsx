import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, loginWithPin } from "../services";

function Login() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
      setErrorMessage("Please select a user and enter a PIN.");
      return;
    }

    const result = await loginWithPin(selectedUserId, pinCode);

    if (result.error) {
      setErrorMessage(result.error);
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

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background:
          "linear-gradient(180deg, #f8faff 0%, #eef3ff 100%)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          border: "1px solid #e4e9f5",
          borderRadius: "28px",
          padding: "40px 32px",
          boxShadow: "0 20px 50px rgba(39, 56, 102, 0.10)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "28px", textAlign: "left" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "0.9rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4f74d9",
            }}
          >
            Login
          </p>

          <h1
            style={{
              margin: "0 0 12px 0",
              fontSize: "3rem",
              lineHeight: 1.05,
              fontWeight: 800,
              color: "#1f2940",
            }}
          >
            Select your profile
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "1.15rem",
              lineHeight: 1.5,
              color: "#5e687c",
            }}
          >
            Enter your PIN to continue.
          </p>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#495466",
              }}
            >
              User
            </label>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: "100%",
                height: "58px",
                padding: "0 18px",
                borderRadius: "18px",
                border: "1.5px solid #d9dfec",
                backgroundColor: "#f8faff",
                color: "#2f3554",
                fontSize: "1.05rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} ({user.role}) - PIN: {user.pin_code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#495466",
              }}
            >
              PIN
            </label>

            <input
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="Enter PIN"
              inputMode="numeric"
              maxLength={6}
              style={{
                width: "100%",
                height: "58px",
                padding: "0 18px",
                borderRadius: "18px",
                border: "1.5px solid #d9dfec",
                backgroundColor: "#f8faff",
                color: "#2f3554",
                fontSize: "1.05rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "16px",
                background: "#fff4f4",
                border: "1px solid #ffd1d1",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.96rem",
                  fontWeight: 600,
                  color: "#c62828",
                }}
              >
                {errorMessage}
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="primary-button"
            style={{
              width: "100%",
              minHeight: "58px",
              borderRadius: "18px",
              fontSize: "1.05rem",
              fontWeight: 700,
              justifyContent: "center",
              marginTop: "4px",
            }}
          >
            Login
          </button>
        </div>
      </div>
    </section>
  );
}

export default Login;