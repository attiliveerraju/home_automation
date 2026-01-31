import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.currentUser) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const login = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      // initialize inactivity timestamp on login
      localStorage.setItem("lastActivityTime", Date.now().toString());

      navigate("/dashboard", { replace: true });
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        setError("User not found");
      } else if (e.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (e.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
          🔐 Smart Home Login
        </h2>

        {error && <div className="error-text">{error}</div>}

        <div className="input-icon">
          <span className="icon">📧</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-icon">
          <span className="icon">🔒</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="primary"
          onClick={login}
          disabled={loading}
          style={{ marginTop: "15px" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}