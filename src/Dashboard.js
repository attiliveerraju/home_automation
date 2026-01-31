import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";

const rooms = [
  { key: "hall", label: "Hall", icon: "🏛️" },
  { key: "bedroom", label: "Bedroom", icon: "🛏️" },
  { key: "living", label: "Living", icon: "🛋️" }
];

const ESP_TIMEOUT = 10000; // 10 seconds

export default function Dashboard() {
  const [room, setRoom] = useState("hall");
  const [devices, setDevices] = useState({});
  const [espOnline, setEspOnline] = useState(false);
  const navigate = useNavigate();

  /* ================= AUTH CHECK + DEVICES ================= */
  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    const devicesRef = ref(db, "devices");
    onValue(devicesRef, (snap) => {
      setDevices(snap.val() || {});
    });
  }, [navigate]);

  /* ================= ESP STATUS ================= */
  useEffect(() => {
    const statusRef = ref(db, "esp/status/lastSeen");

    onValue(statusRef, (snap) => {
      const lastSeen = snap.val();
      if (!lastSeen) {
        setEspOnline(false);
        return;
      }
      setEspOnline(Date.now() - lastSeen < ESP_TIMEOUT);
    });
  }, []);

  /* ================= TOGGLE DEVICE ================= */
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
          <div className="nav-left">
            <span
              className={`esp-status ${espOnline ? "online" : "offline"}`}
            >
              {espOnline ? "🟢 ESP Online" : "🔴 ESP Offline"}
            </span>
          </div>

          <div className="nav-right">
            <button
              className="nav-action"
              onClick={() => navigate("/change-password")}
            >
              🔑 Change Password
            </button>

            <button
              className="nav-action danger"
              onClick={() =>
                auth.signOut().then(() =>
                  navigate("/login", { replace: true })
                )
              }
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