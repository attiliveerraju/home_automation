import { useEffect, useRef, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { auth } from "./firebase";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ChangePassword from "./ChangePassword";

const INACTIVITY_TIME = 1 * 60 * 1000; // 1 minute

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  /* ---------- AUTH + TOKEN STATE ---------- */
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setReady(true);
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Force token refresh → detects password change
        await u.getIdToken(true);
        setUser(u);
      } catch {
        await signOut(auth);
        setUser(null);
        navigate("/login", { replace: true });
      }

      setReady(true);
    });

    return () => unsub();
  }, [navigate]);

  /* ---------- INACTIVITY LOGOUT ---------- */
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        signOut(auth);
      }, INACTIVITY_TIME);
    };

    const events = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "scroll",
    ];

    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  /* ---------- LOADING ---------- */
  if (!ready) {
    return <div className="center">Loading...</div>;
  }

  /* ---------- ROUTES ---------- */
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/change-password"
        element={user ? <ChangePassword /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
