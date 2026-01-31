import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const INACTIVITY_TIME = 1 * 60 * 1000; // 1 minute
const STORAGE_KEY = "lastActivityTime";

export default function useInactivityLogout(user) {
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    const checkInactivity = () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (Date.now() - last > INACTIVITY_TIME) {
        signOut(auth);
      }
    };

    // mark activity
    const events = ["click", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, updateActivity));

    // run checks
    updateActivity();            // on mount
    checkInactivity();           // on resume / reload
    const interval = setInterval(checkInactivity, 5000);

    // when tab comes back from background
    const onVisibility = () => {
      if (!document.hidden) checkInactivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [user]);
}