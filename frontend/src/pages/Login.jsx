import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { registerParent, signInUser } from "../services";

function Login() {
  const [authMode, setAuthMode] = useState("sign-in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const completeLogin = (user) => {
    localStorage.setItem("current_user_id", user.user_id);
    localStorage.setItem("current_user_role", user.role);
    localStorage.setItem("current_user_name", user.name);

    if (String(user.role).toLowerCase() === "parent") {
      navigate("/parent");
    } else {
      navigate("/child");
    }
  };

  const handleSignIn = async () => {
    setErrorMessage("");

    if (!identifier || !password) {
      setErrorMessage("Please enter your account and password.");
      return;
    }

    setIsLoading(true);
    const result = await signInUser({
      identifier,
      password,
    });
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    completeLogin(result.data);
  };

  const handleParentSignUp = async () => {
    setErrorMessage("");

    if (!parentName || !parentEmail || !parentPassword) {
      setErrorMessage("Please complete all parent sign up fields.");
      return;
    }

    setIsLoading(true);
    const result = await registerParent({
      name: parentName,
      email: parentEmail,
      password: parentPassword,
    });
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    completeLogin(result.data);
  };

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
            title={authMode === "sign-up" ? "Create parent account" : "Welcome back"}
            description={
              authMode === "sign-up"
                ? "Parents create their own account first, then create child accounts safely."
                : "Sign in with your account. NeuroFlake will take you to the right space."
            }
          />
        </div>

        <div className="login-profile-grid">
          <button
            type="button"
            className={
              authMode === "sign-in"
                ? "login-profile-button is-selected"
                : "login-profile-button"
            }
            onClick={() => {
              setAuthMode("sign-in");
              setErrorMessage("");
            }}
          >
            <span>✓</span>
            <strong>Sign In</strong>
            <small>Parent email or child username</small>
          </button>

          <button
            type="button"
            className={
              authMode === "sign-up"
                ? "login-profile-button is-selected"
                : "login-profile-button"
            }
            onClick={() => {
              setAuthMode("sign-up");
              setErrorMessage("");
            }}
          >
            <span>+</span>
            <strong>Parent Sign Up</strong>
            <small>Create a parent account</small>
          </button>
        </div>

        <div className="login-demo-pin-box">
          <strong>Prototype access</strong>
          <p>Parent: parent@neuroflake.test / parent123</p>
          <p>Child: leo / child123</p>
        </div>

        <div className="login-form">
          {authMode === "sign-in" && (
            <>
              <label htmlFor="login-identifier">Email or child username</label>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter parent email or child username"
                autoComplete="username"
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSignIn();
                  }
                }}
                placeholder="Enter password"
                autoComplete="current-password"
              />

              {errorMessage && (
                <div className="login-error" role="alert">
                  <p>{errorMessage}</p>
                </div>
              )}

              <Button onClick={handleSignIn} disabled={isLoading}>
                {isLoading ? "Checking..." : "Sign In"}
              </Button>

              <p className="login-note">
                Children cannot create accounts here. A parent or caregiver creates child accounts from the Parent Dashboard.
              </p>
            </>
          )}

          {authMode === "sign-up" && (
            <>
              <label htmlFor="parent-name">Parent name</label>
              <input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => {
                  setParentName(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter your name"
              />

              <label htmlFor="parent-email">Email</label>
              <input
                id="parent-email"
                type="email"
                value={parentEmail}
                onChange={(e) => {
                  setParentEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter email"
                autoComplete="email"
              />

              <label htmlFor="parent-password">Password</label>
              <input
                id="parent-password"
                type="password"
                value={parentPassword}
                onChange={(e) => {
                  setParentPassword(e.target.value);
                  setErrorMessage("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleParentSignUp();
                  }
                }}
                placeholder="Create password"
                autoComplete="new-password"
              />

              {errorMessage && (
                <div className="login-error" role="alert">
                  <p>{errorMessage}</p>
                </div>
              )}

              <Button onClick={handleParentSignUp} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Parent Account"}
              </Button>

              <p className="login-note">
                After signing up, parents can create one or more child accounts.
              </p>
            </>
          )}

          <Button as={Link} to="/" variant="secondary" className="login-home-button">
            Back to Home
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default Login;