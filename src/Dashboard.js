import { useEffect, useState } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";

const rooms = [
  { key: "hall", label: "Hall", icon: "🏛️" },
  { key: "bedroom", label: "Bedroom", icon: "🛏️" },
  { key: "living", label: "Living", icon: "🛋️" }
];

const ESP_TIMEOUT = 10000;

export default function Dashboard() {

  const [room, setRoom] = useState("hall");
  const [devices, setDevices] = useState({});
  const [espOnline, setEspOnline] = useState(false);
  const [tab, setTab] = useState("devices");

  const navigate = useNavigate();

  /* ================= AUTH + DEVICE FETCH ================= */

  useEffect(() => {

    if (!auth.currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    const devicesRef = ref(db, "devices");

    return onValue(devicesRef, (snap) => {
      setDevices(snap.val() || {});
    });

  }, [navigate]);



  /* ================= ESP STATUS ================= */

  useEffect(() => {

    const statusRef = ref(db, "esp/status/lastSeen");

    let lastSeen = 0;

    const unsub = onValue(statusRef, (snap) => {
      lastSeen = snap.val() || 0;
    });

    const interval = setInterval(() => {

      if (!lastSeen) {
        setEspOnline(false);
        return;
      }

      setEspOnline(Date.now() - lastSeen < ESP_TIMEOUT);

    }, 2000);

    return () => {
      clearInterval(interval);
      unsub();
    };

  }, []);



  /* ================= DEVICE TOGGLE ================= */

  const toggle = (light) => {

    set(
      ref(db, `devices/${room}/${light}`),
      !devices[room][light]
    );

  };



  /* ================= SCHEDULING ================= */

  const [scheduleRoom, setScheduleRoom] = useState("hall");
  const [scheduleDevice, setScheduleDevice] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("");
  const [schedules, setSchedules] = useState({});



  useEffect(() => {

    const scheduleRef = ref(db, "schedules");

    return onValue(scheduleRef, (snap) => {
      setSchedules(snap.val() || {});
    });

  }, []);



  const addSchedule = () => {

    if (!scheduleDevice || !scheduleTime) {
      alert("Fill all fields");
      return;
    }

    const ts = new Date(scheduleTime).getTime();

    if (ts < Date.now()) {
      alert("Select future time");
      return;
    }

    push(ref(db, "schedules"), {
      room: scheduleRoom,
      device: scheduleDevice,
      status: scheduleStatus,
      time: ts
    });

    setScheduleDevice("");
    setScheduleTime("");

  };



  const deleteSchedule = (id) => {
    remove(ref(db, "schedules/" + id));
  };



  /* ===== Device list auto from firebase ===== */

  const deviceList =
    devices[scheduleRoom] ? Object.keys(devices[scheduleRoom]) : [];



  return (

    <div className="dashboard layout">

      {/* LEFT NAV */}

      <aside>

        <button
          className={`nav-tab ${tab === "devices" ? "active" : ""}`}
          onClick={() => setTab("devices")}
        >
          💡 Devices
        </button>

        <button
          className={`nav-tab ${tab === "schedule" ? "active" : ""}`}
          onClick={() => setTab("schedule")}
        >
          ⏰ Schedule
        </button>


        {tab === "devices" &&
          rooms.map((r) => (

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



      {/* MAIN */}

      <main>

        {/* TOP BAR */}

        <div className="top-nav">

          <div className="nav-left">

            <span className={`esp-status ${espOnline ? "online" : "offline"}`}>
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



        {/* ================= DEVICES ================= */}

        {tab === "devices" &&

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

        }



        {/* ================= SCHEDULE ================= */}

        {tab === "schedule" &&

          <div className="schedule">

            <h2>Add Schedule</h2>

            <div className="schedule-form">

              <select
                value={scheduleRoom}
                onChange={(e) => setScheduleRoom(e.target.value)}
              >
                <option value="hall">Hall</option>
                <option value="bedroom">Bedroom</option>
                <option value="living">Living</option>
              </select>



              {/* Device auto dropdown */}

              <select
                value={scheduleDevice}
                onChange={(e) => setScheduleDevice(e.target.value)}
              >

                <option value="">Select Device</option>

                {deviceList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}

              </select>



              <select
                value={scheduleStatus}
                onChange={(e) => setScheduleStatus(e.target.value === "true")}
              >
                <option value="true">ON</option>
                <option value="false">OFF</option>
              </select>



              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />


              <button onClick={addSchedule}>
                Add
              </button>

            </div>



            <h3>Schedules</h3>

            {Object.keys(schedules).map((id) => {

              const s = schedules[id];

              return (

                <div key={id} className="schedule-item">

                  <b>{s.room}</b> - {s.device}

                  {" | "}

                  {s.status ? "ON" : "OFF"}

                  {" | "}

                  {new Date(s.time).toLocaleString()}

                  <button onClick={() => deleteSchedule(id)}>
                    Delete
                  </button>

                </div>

              );

            })}

          </div>

        }

      </main>

    </div>

  );
}