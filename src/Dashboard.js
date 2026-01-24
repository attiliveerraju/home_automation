import { useEffect, useState, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";

const rooms = [
  { key: "hall", label: "Hall", icon: "🏛️" },
  { key: "bedroom", label: "Bedroom", icon: "🛏️" },
  { key: "living", label: "Living", icon: "🛋️" }
];

export default function Dashboard() {
  const [room, setRoom] = useState("hall");
  const [devices, setDevices] = useState({});
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);

  // Redirect if not logged in & setup Firebase listener
  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login", { replace: true });
      return;
    }
    const r = ref(db, "devices");
    onValue(r, (snap) => setDevices(snap.val() || {}));
  }, [navigate]);

  // Auto logout on 1 min inactivity
  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      auth.signOut().then(() => navigate("/login", { replace: true }));
    }, 60000); // 1 min
  };

  useEffect(() => {
    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const toggle = (light) => {
    set(ref(db, `devices/${room}/${light}`), !devices[room][light]);
  };

  return (
    <div className="dashboard layout">
      {/* LEFT NAV: Rooms */}
      <aside>
        {rooms.map((r) => (
          <button
            key={r.key}
            className={`nav-tab ${room === r.key ? "active" : ""}`}
            onClick={() => setRoom(r.key)}
          >
            <span className="icon">{r.icon}</span>
            {r.label}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main>
        {/* Top Nav */}
        <div className="top-nav">
          <div className="nav-left"></div>
          <div className="nav-right">
            <button className="nav-action" onClick={() => navigate("/change-password")}>
              🔑 Change Password
            </button>
            <button
              className="nav-action danger"
              onClick={() => auth.signOut().then(() => navigate("/login", { replace: true }))}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Lights Grid */}
        <div className="lights">
          {devices[room] &&
            Object.keys(devices[room]).map((l) => (
              <div
                key={l}
                className={devices[room][l] ? "light on pulse" : "light"}
                onClick={() => toggle(l)}
              >
                💡 {l}
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
