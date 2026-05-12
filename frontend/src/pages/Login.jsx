import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { registerParent, signInUser } from "../services";

function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "child" ? "child" : "parent";
  const initialMode =
    initialRole === "parent" && searchParams.get("mode") === "sign-up"
      ? "sign-up"
      : "sign-in";

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [authMode, setAuthMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const isParent = selectedRole === "parent";
  const isCreatingParent = isParent && authMode === "sign-up";

  const getSignInErrorMessage = (error) => {
    const normalizedError = String(error || "").toLowerCase();

    if (
      normalizedError.includes("could not sign in") ||
      normalizedError.includes("request failed") ||
      normalizedError.includes("failed to fetch") ||
      normalizedError.includes("network")
    ) {
      return "We could not check your sign in right now. Please try again.";
    }

    return isParent
      ? "We could not match that email and password."
      : "That sign in did not work. Ask your parent to check your username and password.";
  };

  const getParentSignUpErrorMessage = (error) => {
    const normalizedError = String(error || "").toLowerCase();

    if (normalizedError.includes("already registered")) {
      return "That email is already in use. Try signing in instead.";
    }

    if (normalizedError.includes("complete all parent sign up fields")) {
      return "Add your name, email, and password.";
    }

    return "We could not create the parent account right now. Please try again.";
  };

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

  const resetFormMessage = () => {
    setErrorMessage("");
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAuthMode("sign-in");
    resetFormMessage();
  };

  const handleSignIn = async () => {
    resetFormMessage();

    if (!identifier || !password) {
      setErrorMessage(isParent ? "Add your email and password." : "Add your name and password.");
      return;
    }

    setIsLoading(true);
    const result = await signInUser({
      identifier,
      password,
    });
    setIsLoading(false);

    if (result.error) {
      setErrorMessage(getSignInErrorMessage(result.error));
      return;
    }

    completeLogin(result.data);
  };

  const handleParentSignUp = async () => {
    resetFormMessage();

    if (!parentName || !parentEmail || !parentPassword) {
      setErrorMessage("Fill in the parent details.");
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
      setErrorMessage(getParentSignUpErrorMessage(result.error));
      return;
    }

    completeLogin(result.data);
  };

  const submitOnEnter = (event, action) => {
    if (event.key === "Enter") {
      action();
    }
  };

  return (
    <section className="login-page login-page--simple">
      <div className="login-visual login-visual--simple" aria-hidden="true">
        <img src="/logo.png" alt="" />
        <div className="login-visual-card">
          <p>Start small</p>
          <strong>Next step</strong>
          <span>Then the next one</span>
        </div>
      </div>

      <Card className="login-card login-card--simple" variant="glow">
        <div className="login-simple-header">
          <p className="home-landing-kicker">Sign in</p>
          <h2>{isCreatingParent ? "Create parent account" : "Who are you?"}</h2>
        </div>

        <div className="login-role-grid" aria-label="Choose account type">
          <button
            type="button"
            className={
              selectedRole === "parent"
                ? "login-role-button is-selected"
                : "login-role-button"
            }
            onClick={() => handleRoleChange("parent")}
          >
            <span>1</span>
            <strong>Parent</strong>
          </button>

          <button
            type="button"
            className={
              selectedRole === "child"
                ? "login-role-button is-selected"
                : "login-role-button"
            }
            onClick={() => handleRoleChange("child")}
          >
            <span>2</span>
            <strong>Child</strong>
          </button>
        </div>

        {isParent && (
          <div className="login-mode-row">
            <button
              type="button"
              className={authMode === "sign-in" ? "login-mode-button is-selected" : "login-mode-button"}
              onClick={() => {
                setAuthMode("sign-in");
                resetFormMessage();
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={authMode === "sign-up" ? "login-mode-button is-selected" : "login-mode-button"}
              onClick={() => {
                setAuthMode("sign-up");
                resetFormMessage();
              }}
            >
              Create account
            </button>
          </div>
        )}

        <div className="login-form login-form--simple">
          {!isCreatingParent && (
            <>
              <label htmlFor="login-identifier">
                {isParent ? "Email" : "Your name"}
              </label>
              <input
                id="login-identifier"
                type={isParent ? "email" : "text"}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  resetFormMessage();
                }}
                placeholder={isParent ? "Email address" : "Username"}
                autoComplete="username"
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  resetFormMessage();
                }}
                onKeyDown={(event) => submitOnEnter(event, handleSignIn)}
                placeholder="password"
                autoComplete="current-password"
              />

              {errorMessage && (
                <div className="login-error" role="alert">
                  <p>{errorMessage}</p>
                </div>
              )}

              <Button onClick={handleSignIn} disabled={isLoading} size="lg">
                {isLoading ? "Checking..." : "Start"}
              </Button>

              {isParent && (
                <div className="login-create-callout">
                  <div>
                    <strong>New parent?</strong>
                    <p>Create an account to set up tasks and child profiles.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("sign-up");
                      resetFormMessage();
                    }}
                  >
                    Create account
                  </button>
                </div>
              )}
            </>
          )}

          {isCreatingParent && (
            <>
              <label htmlFor="parent-name">Name</label>
              <input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => {
                  setParentName(e.target.value);
                  resetFormMessage();
                }}
                placeholder="Your name"
              />

              <label htmlFor="parent-email">Email</label>
              <input
                id="parent-email"
                type="email"
                value={parentEmail}
                onChange={(e) => {
                  setParentEmail(e.target.value);
                  resetFormMessage();
                }}
                placeholder="Email address"
                autoComplete="email"
              />

              <label htmlFor="parent-password">Password</label>
              <input
                id="parent-password"
                type="password"
                value={parentPassword}
                onChange={(e) => {
                  setParentPassword(e.target.value);
                  resetFormMessage();
                }}
                onKeyDown={(event) => submitOnEnter(event, handleParentSignUp)}
                placeholder="Create password"
                autoComplete="new-password"
              />

              {errorMessage && (
                <div className="login-error" role="alert">
                  <p>{errorMessage}</p>
                </div>
              )}

              <Button onClick={handleParentSignUp} disabled={isLoading} size="lg">
                {isLoading ? "Creating..." : "Create account"}
              </Button>
            </>
          )}

          <Button as={Link} to="/" variant="secondary" className="login-home-button">
            Back home
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default Login;
