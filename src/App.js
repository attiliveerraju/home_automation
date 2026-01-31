import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./Login";
import Dashboard from "./Dashboard";
import ChangePassword from "./ChangePassword";
import useInactivityLogout from "./useInactivityLogout";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  /* ================= INACTIVITY LOGOUT ================= */
  useInactivityLogout(user);

  /* ================= FORCE TOKEN REFRESH ================= */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        signOut(auth);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  if (!ready) {
    return <div className="center">Loading...</div>;
  }

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