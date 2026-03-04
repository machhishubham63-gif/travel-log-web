import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function CalendarView({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Fetch Travels for the selected month
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

  // Calendar Math
  const year = parseInt(currentMonth.split("-")[0]);
  const month = parseInt(currentMonth.split("-")[1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday...

  // Helper to get the exact color for a method based on your PDF design
  const getColorForMethod = (method, isNotGoing) => {
    if (isNotGoing) return "#ef4444"; // Red - Not Going
    if (method === "Own Vehicle") return "#3b82f6"; // Blue
    if (method === "Train") return "#a855f7"; // Purple
    if (method === "Bus") return "#f97316"; // Orange
    if (method === "Prashant Surve" || method === "Prashant") return "#22c55e"; // Green
    if (method === "Unnat Machhi" || method === "Unnat") return "#eab308"; // Yellow
    return "#888"; // Gray fallback for new persons
  };

  // Build the calendar grid
  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => (
      <div key={`blank-${i}`} style={{ padding: "10px" }}></div>
    ));

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Find the entry for this specific day
      const entry = travels.find(t => t.date === formattedDate);

      return (
        <div 
          key={day} 
          onClick={() => entry && setSelectedEntry(entry)}
          style={{ 
            padding: "10px 5px", 
            textAlign: "center", 
            backgroundColor: entry ? "#2d2d2d" : "transparent",
            borderRadius: "8px",
            cursor: entry ? "pointer" : "default",
            minHeight: "50px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid #333"
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "bold", color: entry ? "white" : "#666" }}>
            {day}
          </span>
          
          {/* Render the dots if an entry exists */}
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

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ paddingBottom: "20px" }}>
      
      {/* Header & Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white" }}>Calendar</h2>
        <input 
          type="month" 
          value={currentMonth} 
          onChange={(e) => setCurrentMonth(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "white" }}
        />
      </div>

      {/* The Calendar Grid */}
      <div style={{ backgroundColor: "#1e1e1e", padding: "15px", borderRadius: "10px", color: "white" }}>
        {/* Weekday Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "10px", textAlign: "center" }}>
          {weekdays.map(day => (
            <div key={day} style={{ fontSize: "12px", color: "#aaa", fontWeight: "bold" }}>{day}</div>
          ))}
        </div>
        
        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#aaa", padding: "10px", backgroundColor: "#1e1e1e", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div> Own Vehicle</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#a855f7" }}></div> Train</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f97316" }}></div> Bus</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div> Prashant</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#eab308" }}></div> Unnat</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div> Not Going</div>
      </div>

      {/* Selected Entry Detail Modal */}
      {selectedEntry && (
        <div style={{ marginTop: "20px", backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", borderLeft: selectedEntry.isNotGoing ? "5px solid #ef4444" : "5px solid #4caf50" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "white" }}>{selectedEntry.date.split("-").reverse().join("/")} Details</h3>
            <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "16px", cursor: "pointer" }}>✖</button>
          </div>
          
          {selectedEntry.isNotGoing ? (
            <p style={{ color: "#ef4444", margin: 0 }}>❌ Marked as Not Going</p>
          ) : (
            <div>
              <p style={{ margin: "0 0 8px 0", color: "white" }}>
                <strong style={{ color: "#60a5fa" }}>☀️ Morning:</strong> {selectedEntry.morning?.method} (₹{selectedEntry.morning?.amount})
              </p>
              <p style={{ margin: "0 0 8px 0", color: "white" }}>
                <strong style={{ color: "#f472b6" }}>🌙 Evening:</strong> {selectedEntry.evening?.method} (₹{selectedEntry.evening?.amount})
              </p>
              <p style={{ margin: 0, color: "white", fontWeight: "bold" }}>Total: ₹{selectedEntry.totalAmount}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
