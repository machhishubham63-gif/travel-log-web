import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function CalendarView({ user, globalMonth, setGlobalMonth, navigateTo }) {
  // Use the global month if it exists, otherwise default to current month
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Keep the local selector in sync with the global state
  useEffect(() => {
    if (globalMonth && globalMonth !== currentMonth) {
      setCurrentMonth(globalMonth);
    }
  }, [globalMonth]);

  const handleMonthChange = (e) => {
    setCurrentMonth(e.target.value);
    setGlobalMonth(e.target.value);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "travels"),
      where("userId", "==", user.uid),
      where("monthKey", "==", currentMonth)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTravels(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user, currentMonth]);

  const year = parseInt(currentMonth.split("-")[0]);
  const month = parseInt(currentMonth.split("-")[1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const getColorForMethod = (method, isNotGoing) => {
    if (isNotGoing) return "#ef4444"; 
    if (method === "Own Vehicle") return "#3b82f6"; 
    if (method === "Train") return "#a855f7"; 
    if (method === "Bus") return "#f97316"; 
    if (method === "Prashant Surve" || method === "Prashant") return "#22c55e"; 
    if (method === "Unnat Machhi" || method === "Unnat") return "#eab308"; 
    return "#888"; 
  };

  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} style={{ padding: "10px" }}></div>);

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const entry = travels.find(t => t.date === formattedDate);

      return (
        <div 
          key={day} 
          onClick={() => entry && setSelectedEntry(entry)}
          style={{ 
            padding: "10px 5px", textAlign: "center", backgroundColor: entry ? "#222222" : "transparent",
            borderRadius: "12px", cursor: entry ? "pointer" : "default", minHeight: "50px",
            display: "flex", flexDirection: "column", alignItems: "center", border: entry ? "1px solid #333" : "none"
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "700", color: entry ? "white" : "#444" }}>{day}</span>
          {entry && (
            <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
              {entry.isNotGoing ? (
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getColorForMethod("", true) }}></div>
              ) : (
                <>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.morning?.method, false) }}></div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.evening?.method, false) }}></div>
                </>
              )}
            </div>
          )}
        </div>
      );
    });
    return [...blanks, ...days];
  };

  return (
    <div style={{ paddingBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white", paddingLeft: "4px" }}>Calendar</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", background: "#222222", color: "white", fontSize: "16px" }} />
      </div>

      <div style={{ backgroundColor: "#111111", padding: "16px", borderRadius: "20px", color: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "10px", textAlign: "center" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={{ fontSize: "12px", color: "#888", fontWeight: "700" }}>{day}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
          {renderCalendarDays()}
        </div>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#aaa", padding: "16px", backgroundColor: "#111111", borderRadius: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div> Own Vehicle</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#a855f7" }}></div> Train</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f97316" }}></div> Bus</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div> Prashant</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#eab308" }}></div> Unnat</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div> Not Going</div>
      </div>

      {selectedEntry && (
        <div style={{ marginTop: "20px", backgroundColor: "#111111", padding: "20px", borderRadius: "20px", borderLeft: selectedEntry.isNotGoing ? "6px solid #ef4444" : "6px solid #34d399" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>{selectedEntry.date.split("-").reverse().join("/")}</h3>
            <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}>✖</button>
          </div>
          
          {selectedEntry.isNotGoing ? (
            <p style={{ color: "#fca5a5", margin: 0, fontWeight: "600" }}>❌ Marked as Not Going</p>
          ) : (
            <div>
              <p style={{ margin: "0 0 8px 0", color: "white", fontSize: "15px" }}>
                <strong style={{ color: "#a8c7fa" }}>☀️ Morning:</strong> {selectedEntry.morning?.method} (₹{selectedEntry.morning?.amount})
              </p>
              <p style={{ margin: "0 0 16px 0", color: "white", fontSize: "15px" }}>
                <strong style={{ color: "#f9a8d4" }}>🌙 Evening:</strong> {selectedEntry.evening?.method} (₹{selectedEntry.evening?.amount})
              </p>
              <p style={{ margin: 0, color: "white", fontWeight: "700", fontSize: "18px" }}>Total: ₹{selectedEntry.totalAmount}</p>
            </div>
          )}

          {/* NEW: Click to navigate to History Tab */}
          <button 
            onClick={() => { navigateTo("history"); setSelectedEntry(null); }}
            style={{ marginTop: "16px", width: "100%", padding: "12px", backgroundColor: "#222222", color: "white", border: "1px solid #444", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}
          >
            Edit / View in History ➡️
          </button>
        </div>
      )}
    </div>
  );
}
