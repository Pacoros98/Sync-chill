import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Link } from "react-router";
import { auth } from "../firebase";
import "../styles/main.scss";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      // Avoid confirming whether an email is registered.
      if (err instanceof FirebaseError && err.code === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Reset password</h1>

        {error && <div className="error-message">{error}</div>}

        {sent ? (
          <p className="signup-link">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="signup-link">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
