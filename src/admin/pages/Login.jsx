import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import gearsLogo from "../../assets/images/gears-logo.png";
import { useAdminAuth } from "../AdminAuthContext";
import { ADMIN_BASE_PATH } from "../routes";
import { Field } from "../components/ui";

const Login = () => {
  const { login } = useAdminAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      /*
        Credentials are verified entirely on the server: it checks
        the account exists, is active, and that the password matches
        the stored bcrypt hash.
      */
      await login(email.trim(), password);

      navigate(ADMIN_BASE_PATH, { replace: true });
    } catch (caught) {
      setError(caught.message || "Unable to sign in. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src={gearsLogo} alt="GEARS" />

          <h1>GEARS ADMIN</h1>

          <p>Garrison Engineering &amp; Robotic Society</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <Field label="Email address" required>
            <input
              className="admin-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
              autoFocus
            />
          </Field>

          <Field label="Password" required>
            <div className="admin-password-wrap">
              <input
                className="admin-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "11px" }}
          >
            {loading && <span className="admin-spinner small" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="admin-login-foot">
          Authorised personnel only.
          <br />
          Contact another admin if you cannot access your account.
        </p>
      </div>
    </div>
  );
};

export default Login;
