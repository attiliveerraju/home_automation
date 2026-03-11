import { useEffect, useState } from "react";
import { ref, push, onValue, remove, update } from "firebase/database";
import { db } from "./firebase";

export default function Schedule() {

  const [room,setRoom] = useState("hall");
  const [device,setDevice] = useState("");
  const [status,setStatus] = useState(true);
  const [dateTime,setDateTime] = useState("");
  const [schedules,setSchedules] = useState([]);

  useEffect(()=>{

    const scheduleRef = ref(db,"schedules");

    return onValue(scheduleRef,(snap)=>{

      const data = snap.val() || {};
      const list = Object.entries(data).map(([id,val])=>({
        id,
        ...val
      }));

      setSchedules(list);

    });

  },[]);

  const addSchedule = () => {

    const timestamp = new Date(dateTime).getTime();

    if(timestamp < Date.now()){
      alert("Please select future time");
      return;
    }

    push(ref(db,"schedules"),{
      room,
      device,
      status,
      time:timestamp
    });

    setDevice("");
    setDateTime("");

  };

  const deleteSchedule = (id) => {
    remove(ref(db,"schedules/"+id));
  };

  return (

  <div>

    <h2>Scheduling</h2>

    <div>

      <select value={room} onChange={(e)=>setRoom(e.target.value)}>
        <option value="hall">Hall</option>
        <option value="bedroom">Bedroom</option>
        <option value="living">Living</option>
      </select>

      <input
        placeholder="Device name"
        value={device}
        onChange={(e)=>setDevice(e.target.value)}
      />

      <select
        value={status}
        onChange={(e)=>setStatus(e.target.value==="true")}
      >
        <option value="true">ON</option>
        <option value="false">OFF</option>
      </select>

      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e)=>setDateTime(e.target.value)}
      />

      <button onClick={addSchedule}>Add Schedule</button>

    </div>

    <h3>Schedules</h3>

    {schedules.map((s)=>(
      <div key={s.id} style={{margin:"10px 0"}}>

        <b>{s.room}</b> - {s.device} - {s.status ? "ON" : "OFF"}

        {" | "}

        {new Date(s.time).toLocaleString()}

        <button
          style={{marginLeft:"10px"}}
          onClick={()=>deleteSchedule(s.id)}
        >
          Delete
        </button>

      </div>
    ))}

  </div>

  );

}