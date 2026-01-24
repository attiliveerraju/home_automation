import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ChangePassword from "./ChangePassword";

const INACTIVITY_TIME = 1 * 60 * 1000; // 5 minutes

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  /* ---------- AUTH STATE ---------- */
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Force refresh token
        await user.getIdToken(true);
      } catch {
        await auth.signOut();
        navigate("/login", { replace: true });
      }
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

    // Events that count as activity
    const events = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "scroll"
    ];

    events.forEach(e =>
      window.addEventListener(e, resetTimer)
    );

    resetTimer(); // start timer immediately

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e =>
        window.removeEventListener(e, resetTimer)
      );
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
