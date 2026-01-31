import { useEffect, useState } from "react";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) navigate("/login");
  }, [navigate]);

  const handleUpdate = async () => {
    setError("");
    setSuccess("");

    if (!current || !newPass || !confirmPass) {
      setError("All fields are required");
      return;
    }

    if (newPass !== confirmPass) {
      setError("New password and confirm password do not match");
      return;
    }

    if (newPass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        current
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);

      setSuccess("Password updated successfully. Redirecting to login...");

      setTimeout(async () => {
        // clear inactivity timestamp before logout
        localStorage.removeItem("lastActivityTime");

        await signOut(auth);
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please login again and retry");
      } else {
        setError("Failed to update password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
          🔑 Change Password
        </h2>

        {error && <div className="error-text">{error}</div>}
        {success && <div className="success-text">{success}</div>}

        <div className="input-icon">
          <span className="icon">🔒</span>
          <input
            type="password"
            placeholder="Current Password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div className="input-icon">
          <span className="icon">🔑</span>
          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </div>

        <div className="input-icon">
          <span className="icon">🔑</span>
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
        </div>

        <button
          className="primary"
          onClick={handleUpdate}
          disabled={loading}
          style={{ marginTop: "15px" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <button
          className="primary"
          onClick={() => navigate("/dashboard")}
          style={{ marginTop: "10px", background: "#1e293b" }}
        >
          ⬅ Back
        </button>
      </div>
    </div>
  );
}