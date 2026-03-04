import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function CalendarView({ user, globalMonth, setGlobalMonth }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]); 
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => { if (globalMonth && globalMonth !== currentMonth) setCurrentMonth(globalMonth); }, [globalMonth]);

  const handleMonthChange = (e) => {
    setCurrentMonth(e.target.value); setGlobalMonth(e.target.value);
    setSelectedEntry(null); setIsEditing(false);
  };

  // NEW FEATURE: Jump to Today
  const handleJumpToToday = () => {
    const todayMonth = new Date().toISOString().substring(0, 7);
    setCurrentMonth(todayMonth); setGlobalMonth(todayMonth);
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "travels"), where("userId", "==", user.uid), where("monthKey", "==", currentMonth)), (snapshot) => {
      setTravels(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "persons"), where("userId", "==", user.uid)), (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  const year = parseInt(currentMonth.split("-")[0]);
  const month = parseInt(currentMonth.split("-")[1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Updated to CSS Variables for color dots
  const getColorForMethod = (method, isNotGoing) => {
    if (isNotGoing) return "var(--accent-red)"; 
    if (method === "Own Vehicle") return "var(--accent-blue)"; 
    if (method === "Train") return "var(--accent-purple)"; 
    if (method === "Bus") return "#ffb74d"; 
    if (method === "Prashant Surve" || method === "Prashant") return "var(--accent-green)"; 
    if (method === "Unnat Machhi" || method === "Unnat") return "var(--accent-yellow)"; 
    return "var(--text-faded)"; 
  };

  const openDetails = (entry) => { setSelectedEntry(entry); setIsEditing(false); };

  const startEditing = () => {
    setEditForm({
      isNotGoing: selectedEntry.isNotGoing || false,
      morningMethod: selectedEntry.morning?.method || "Own Vehicle", morningAmount: selectedEntry.morning?.amount || 0, morningNote: selectedEntry.morning?.note || "",
      eveningMethod: selectedEntry.evening?.method || "Own Vehicle", eveningAmount: selectedEntry.evening?.amount || 0, eveningNote: selectedEntry.evening?.note || ""
    });
    setIsEditing(true);
  };

  const handleEditMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0; const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;
    if (timeOfDay === "morning") setEditForm({ ...editForm, morningMethod: selectedMethod, morningAmount: amountToSet });
    else setEditForm({ ...editForm, eveningMethod: selectedMethod, eveningAmount: amountToSet });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "travels", selectedEntry.id), {
        isNotGoing: editForm.isNotGoing,
        morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote },
        evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote },
        totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
      });
      setSelectedEntry({ ...selectedEntry, isNotGoing: editForm.isNotGoing, totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0), morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote }, evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote }});
      setIsEditing(false);
    } catch (error) { alert("Failed to update."); }
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];

  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`}></div>);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1; const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const entry = travels.find(t => t.date === formattedDate); const isSelected = selectedEntry?.date === formattedDate;

      return (
        <div key={day} onClick={() => entry && openDetails(entry)}
          style={{ padding: "12px 4px", textAlign: "center", backgroundColor: isSelected ? "var(--bg-input)" : entry ? "var(--bg-surface)" : "transparent", borderRadius: "16px", cursor: entry ? "pointer" : "default", minHeight: "55px", display: "flex", flexDirection: "column", alignItems: "center", border: isSelected ? "1px solid var(--border-strong)" : entry ? "1px solid var(--border-light)" : "1px solid transparent", transition: "all 0.2s ease" }}
        >
          <span style={{ fontSize: "15px", fontWeight: isSelected ? "800" : "600", color: isSelected ? "var(--text-main)" : entry ? "var(--text-main)" : "var(--text-faded)" }}>{day}</span>
          {entry && (
            <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
              {entry.isNotGoing ? <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod("", true) }}></div> : <>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.morning?.method, false) }}></div>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getColorForMethod(entry.evening?.method, false) }}></div>
              </>}
            </div>
          )}
        </div>
      );
    });
    return [...blanks, ...days];
  };

  const inputStyle = { width: "100%", padding: "14px", marginBottom: "10px", boxSizing: "border-box", borderRadius: "16px", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", fontSize: "15px", fontWeight: "600" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Calendar</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleJumpToToday} style={{ padding: "8px", borderRadius: "20px", border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--accent-blue)", fontWeight: "800", cursor: "pointer" }}>Today</button>
          <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "10px 12px", borderRadius: "20px", border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600" }} />
        </div>
      </div>

      <div style={{ backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", border: "1px solid var(--border-light)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "16px", textAlign: "center" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>{day}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>{renderCalendarDays()}</div>
      </div>

      {selectedEntry && (
        <div style={{ marginTop: "24px", backgroundColor: "var(--bg-surface)", padding: "24px", borderRadius: "32px", border: "1px solid var(--border-strong)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: selectedEntry.isNotGoing ? "var(--accent-red)" : "var(--accent-blue)" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "20px", fontWeight: "800" }}>{selectedEntry.date.split("-").reverse().join("/")}</h3>
            <button onClick={() => { setSelectedEntry(null); setIsEditing(false); }} style={{ background: "var(--bg-input)", border: "1px solid var(--border-strong)", color: "var(--text-muted)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✖</button>
          </div>
          
          {!isEditing ? (
            <>
              {selectedEntry.isNotGoing ? (
                <div style={{ backgroundColor: "var(--accent-red-bg)", padding: "16px", borderRadius: "20px", color: "var(--accent-red)", fontWeight: "800", textAlign: "center" }}>❌ Marked as Not Going</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ backgroundColor: "var(--bg-card)", padding: "16px", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>☀️ Morning</p>
                    <p style={{ margin: "4px 0 0 0", color: "var(--text-main)", fontSize: "16px", fontWeight: "800" }}>{selectedEntry.morning?.method} <span style={{ float: "right", color: "var(--accent-blue)" }}>₹{selectedEntry.morning?.amount}</span></p>
                    {selectedEntry.morning?.note && <p style={{ margin: "6px 0 0 0", color: "var(--text-faded)", fontSize: "14px", fontStyle: "italic" }}>"{selectedEntry.morning.note}"</p>}
                  </div>
                  <div style={{ backgroundColor: "var(--bg-card)", padding: "16px", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>🌙 Evening</p>
                    <p style={{ margin: "4px 0 0 0", color: "var(--text-main)", fontSize: "16px", fontWeight: "800" }}>{selectedEntry.evening?.method} <span style={{ float: "right", color: "var(--accent-purple)" }}>₹{selectedEntry.evening?.amount}</span></p>
                    {selectedEntry.evening?.note && <p style={{ margin: "6px 0 0 0", color: "var(--text-faded)", fontSize: "14px", fontStyle: "italic" }}>"{selectedEntry.evening.note}"</p>}
                  </div>
                  <div style={{ marginTop: "8px", padding: "0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: "800" }}>Total</span>
                    <span style={{ color: "var(--text-main)", fontSize: "24px", fontWeight: "800" }}>₹{selectedEntry.totalAmount}</span>
                  </div>
                </div>
              )}
              <button onClick={startEditing} style={{ marginTop: "24px", width: "100%", padding: "16px", backgroundColor: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-strong)", borderRadius: "24px", fontWeight: "800", fontSize: "16px", cursor: "pointer" }}>Edit This Day</button>
            </>
          ) : (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "16px", cursor: "pointer", backgroundColor: editForm.isNotGoing ? "var(--accent-red-bg)" : "var(--bg-input)", color: editForm.isNotGoing ? "var(--accent-red)" : "var(--text-main)", border: editForm.isNotGoing ? "1px solid var(--accent-red)" : "1px solid var(--border-strong)", padding: "16px", borderRadius: "20px", fontWeight: "800" }}>
                <input type="checkbox" checked={editForm.isNotGoing} onChange={(e) => setEditForm({ ...editForm, isNotGoing: e.target.checked })} style={{ marginRight: "12px", accentColor: "var(--accent-red)", width: "20px", height: "20px" }} /> Not Going
              </label>

              {!editForm.isNotGoing && (
                <>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "16px", borderRadius: "24px", marginBottom: "16px", border: "1px solid var(--border-strong)" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-blue)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>☀️ Morning</h4>
                    <select value={editForm.morningMethod} onChange={(e) => handleEditMethodChange("morning", e.target.value)} style={inputStyle}>{availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}</select>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input type="number" value={editForm.morningAmount} onChange={(e) => setEditForm({ ...editForm, morningAmount: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                      <input type="text" placeholder="Note" value={editForm.morningNote} onChange={(e) => setEditForm({ ...editForm, morningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5 }} />
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "16px", borderRadius: "24px", marginBottom: "16px", border: "1px solid var(--border-strong)" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-purple)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>🌙 Evening</h4>
                    <select value={editForm.eveningMethod} onChange={(e) => handleEditMethodChange("evening", e.target.value)} style={inputStyle}>{availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}</select>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input type="number" value={editForm.eveningAmount} onChange={(e) => setEditForm({ ...editForm, eveningAmount: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                      <input type="text" placeholder="Note" value={editForm.eveningNote} onChange={(e) => setEditForm({ ...editForm, eveningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5 }} />
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "16px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: "24px", color: "var(--text-main)", fontWeight: "800" }}>Cancel</button>
                <button onClick={saveEdit} style={{ flex: 2, padding: "16px", background: "var(--accent-green)", color: "#000", border: "none", borderRadius: "24px", fontWeight: "800" }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
