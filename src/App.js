import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ChangePassword from "./ChangePassword";

/* 🔐 Auto logout after inactivity */
const INACTIVITY_TIME = 1 * 60 * 1000; // 1 minute

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (u) => {
      setUser(u);       // ONLY update state
      setReady(true);   // App ready after first check
    });

    return () => unsubscribe();
  }, []);

  /* ================= INACTIVITY LOGOUT ================= */
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
      "scroll"
    ];

    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer(); // start timer immediately

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  /* ================= FORCE TOKEN REFRESH =================
     Logs out other devices after password change
  */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        signOut(auth);
      }
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, [user]);

  /* ================= LOADING ================= */
  if (!ready) {
    return <div className="center">Loading...</div>;
  }

  /* ================= ROUTES ================= */
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/change-password"
        element={user ? <ChangePassword /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
