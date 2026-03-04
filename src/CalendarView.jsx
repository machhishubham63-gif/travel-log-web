import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function CalendarView({ user, globalMonth, setGlobalMonth }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]); // Needed for the edit dropdown
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Sync with global month
  useEffect(() => {
    if (globalMonth && globalMonth !== currentMonth) {
      setCurrentMonth(globalMonth);
    }
  }, [globalMonth]);

  const handleMonthChange = (e) => {
    setCurrentMonth(e.target.value);
    setGlobalMonth(e.target.value);
    setSelectedEntry(null);
    setIsEditing(false);
  };

  // Fetch Travels
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid), where("monthKey", "==", currentMonth));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTravels(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user, currentMonth]);

  // Fetch Persons for Edit Dropdown
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // Calendar Math
  const year = parseInt(currentMonth.split("-")[0]);
  const month = parseInt(currentMonth.split("-")[1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Premium Colors
  const getColorForMethod = (method, isNotGoing) => {
    if (isNotGoing) return "#ff5252"; // Vibrant Red
    if (method === "Own Vehicle") return "#448aff"; // Material Blue
    if (method === "Train") return "#b388ff"; // Deep Purple
    if (method === "Bus") return "#ffb74d"; // Soft Orange
    if (method === "Prashant Surve" || method === "Prashant") return "#69f0ae"; // Neon Green
    if (method === "Unnat Machhi" || method === "Unnat") return "#ffd740"; // Neon Yellow
    return "#9e9e9e"; 
  };

  const openDetails = (entry) => {
    setSelectedEntry(entry);
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditForm({
      isNotGoing: selectedEntry.isNotGoing || false,
      morningMethod: selectedEntry.morning?.method || "Own Vehicle",
      morningAmount: selectedEntry.morning?.amount || 0,
      morningNote: selectedEntry.morning?.note || "",
      eveningMethod: selectedEntry.evening?.method || "Own Vehicle",
      eveningAmount: selectedEntry.evening?.amount || 0,
      eveningNote: selectedEntry.evening?.note || ""
    });
    setIsEditing(true);
  };

  const handleEditMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;

    if (timeOfDay === "morning") {
      setEditForm({ ...editForm, morningMethod: selectedMethod, morningAmount: amountToSet });
    } else {
      setEditForm({ ...editForm, eveningMethod: selectedMethod, eveningAmount: amountToSet });
    }
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "travels", selectedEntry.id), {
        isNotGoing: editForm.isNotGoing,
        morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote },
        evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote },
        totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
      });
      // Update local state to show changes instantly
      setSelectedEntry({ ...selectedEntry, 
        isNotGoing: editForm.isNotGoing,
        totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
        morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote },
        evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote }
      });
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update entry.");
    }
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];

  // --- UI RENDERING ---
  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`}></div>);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const entry = travels.find(t => t.date === formattedDate);
      const isSelected = selectedEntry?.date === formattedDate;

      return (
        <div 
          key={day} 
          onClick={() => entry && openDetails(entry)}
          style={{ 
            padding: "12px 4px", textAlign: "center", 
            backgroundColor: isSelected ? "#333333" : entry ? "#1A1A1A" : "transparent",
            borderRadius: "16px", cursor: entry ? "pointer" : "default", minHeight: "55px",
            display: "flex", flexDirection: "column", alignItems: "center", 
            border: isSelected ? "1px solid #555" : entry ? "1px solid #222" : "1px solid transparent",
            transition: "all 0.2s ease"
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: isSelected ? "800" : "600", color: isSelected ? "#fff" : entry ? "#ccc" : "#444" }}>{day}</span>
          {entry && (
            <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
              {entry.isNotGoing ? (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod("", true) }}></div>
              ) : (
                <>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.morning?.method, false) }}></div>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.evening?.method, false) }}></div>
                </>
              )}
            </div>
          )}
        </div>
      );
    });
    return [...blanks, ...days];
  };

  const inputStyle = { width: "100%", padding: "14px", marginBottom: "10px", boxSizing: "border-box", borderRadius: "16px", border: "none", backgroundColor: "#0A0A0A", color: "white", fontSize: "15px" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Sleek Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Calendar</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "10px 16px", borderRadius: "20px", border: "1px solid #333", background: "#1A1A1A", color: "white", fontSize: "16px", fontWeight: "600" }} />
      </div>

      {/* Main Calendar Card */}
      <div style={{ backgroundColor: "#111111", padding: "20px", borderRadius: "32px", border: "1px solid #222", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "16px", textAlign: "center" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={{ fontSize: "12px", color: "#666", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{day}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {renderCalendarDays()}
        </div>
      </div>

      {/* Modern Legend */}
      <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "10px", padding: "0 8px" }}>
        {[
          { label: "Own Vehicle", color: "#448aff" }, { label: "Train", color: "#b388ff" }, { label: "Bus", color: "#ffb74d" },
          { label: "Prashant", color: "#69f0ae" }, { label: "Unnat", color: "#ffd740" }, { label: "Not Going", color: "#ff5252" }
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#1A1A1A", padding: "6px 12px", borderRadius: "20px", border: "1px solid #222" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }}></div>
            <span style={{ fontSize: "12px", color: "#aaa", fontWeight: "600" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* INLINE EDIT MODAL / BOTTOM SHEET */}
      {selectedEntry && (
        <div style={{ marginTop: "24px", backgroundColor: "#1A1A1A", padding: "24px", borderRadius: "32px", border: "1px solid #333", position: "relative", overflow: "hidden" }}>
          {/* Subtle accent glow top border */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: selectedEntry.isNotGoing ? "#ff5252" : "#448aff" }}></div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "white", fontSize: "20px", fontWeight: "800" }}>{selectedEntry.date.split("-").reverse().join("/")}</h3>
            <button onClick={() => { setSelectedEntry(null); setIsEditing(false); }} style={{ background: "#2A2A2A", border: "none", color: "#aaa", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✖</button>
          </div>
          
          {!isEditing ? (
            // VIEW MODE
            <>
              {selectedEntry.isNotGoing ? (
                <div style={{ backgroundColor: "#ff525220", padding: "16px", borderRadius: "20px", color: "#ff8a80", fontWeight: "700", textAlign: "center" }}>❌ Marked as Not Going</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "20px" }}>
                    <p style={{ margin: 0, color: "#aaa", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>☀️ Morning</p>
                    <p style={{ margin: "4px 0 0 0", color: "white", fontSize: "16px", fontWeight: "700" }}>{selectedEntry.morning?.method} <span style={{ float: "right", color: "#448aff" }}>₹{selectedEntry.morning?.amount}</span></p>
                    {selectedEntry.morning?.note && <p style={{ margin: "6px 0 0 0", color: "#666", fontSize: "14px" }}>"{selectedEntry.morning.note}"</p>}
                  </div>
                  <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "20px" }}>
                    <p style={{ margin: 0, color: "#aaa", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>🌙 Evening</p>
                    <p style={{ margin: "4px 0 0 0", color: "white", fontSize: "16px", fontWeight: "700" }}>{selectedEntry.evening?.method} <span style={{ float: "right", color: "#b388ff" }}>₹{selectedEntry.evening?.amount}</span></p>
                    {selectedEntry.evening?.note && <p style={{ margin: "6px 0 0 0", color: "#666", fontSize: "14px" }}>"{selectedEntry.evening.note}"</p>}
                  </div>
                  <div style={{ marginTop: "8px", padding: "0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#aaa", fontWeight: "600" }}>Total</span>
                    <span style={{ color: "white", fontSize: "24px", fontWeight: "800" }}>₹{selectedEntry.totalAmount}</span>
                  </div>
                </div>
              )}
              <button onClick={startEditing} style={{ marginTop: "24px", width: "100%", padding: "16px", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "24px", fontWeight: "800", fontSize: "16px", cursor: "pointer" }}>
                Edit This Day
              </button>
            </>
          ) : (
            // EDIT MODE
            <div style={{ animation: "fadeIn 0.3s" }}>
               <label style={{ display: "flex", alignItems: "center", marginBottom: "16px", cursor: "pointer", backgroundColor: editForm.isNotGoing ? "#ff525220" : "#0A0A0A", color: editForm.isNotGoing ? "#ff8a80" : "white", padding: "16px", borderRadius: "20px", fontWeight: "700" }}>
                <input type="checkbox" checked={editForm.isNotGoing} onChange={(e) => setEditForm({ ...editForm, isNotGoing: e.target.checked })} style={{ marginRight: "12px", accentColor: "#ff5252", width: "20px", height: "20px" }} />
                Mark as Not Going
              </label>

              {!editForm.isNotGoing && (
                <>
                  <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "24px", marginBottom: "16px" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "#448aff", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>☀️ Morning</h4>
                    <select value={editForm.morningMethod} onChange={(e) => handleEditMethodChange("morning", e.target.value)} style={{...inputStyle, backgroundColor: "#1A1A1A"}}>
                      {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input type="number" value={editForm.morningAmount} onChange={(e) => setEditForm({ ...editForm, morningAmount: e.target.value })} style={{ ...inputStyle, backgroundColor: "#1A1A1A", flex: 1 }} />
                      <input type="text" placeholder="Note" value={editForm.morningNote} onChange={(e) => setEditForm({ ...editForm, morningNote: e.target.value })} style={{ ...inputStyle, backgroundColor: "#1A1A1A", flex: 1.5 }} />
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "24px", marginBottom: "16px" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "#b388ff", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>🌙 Evening</h4>
                    <select value={editForm.eveningMethod} onChange={(e) => handleEditMethodChange("evening", e.target.value)} style={{...inputStyle, backgroundColor: "#1A1A1A"}}>
                      {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input type="number" value={editForm.eveningAmount} onChange={(e) => setEditForm({ ...editForm, eveningAmount: e.target.value })} style={{ ...inputStyle, backgroundColor: "#1A1A1A", flex: 1 }} />
                      <input type="text" placeholder="Note" value={editForm.eveningNote} onChange={(e) => setEditForm({ ...editForm, eveningNote: e.target.value })} style={{ ...inputStyle, backgroundColor: "#1A1A1A", flex: 1.5 }} />
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "16px", background: "#333", border: "none", borderRadius: "24px", color: "white", fontWeight: "700" }}>Cancel</button>
                <button onClick={saveEdit} style={{ flex: 2, padding: "16px", background: "#69f0ae", color: "#000", border: "none", borderRadius: "24px", fontWeight: "800" }}>Save Details</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
