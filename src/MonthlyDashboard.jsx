import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

export default function MonthlyDashboard({ user, globalMonth, setGlobalMonth, userSettings }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => { if (globalMonth && globalMonth !== currentMonth) setCurrentMonth(globalMonth); }, [globalMonth]);

  const handleMonthChange = (e) => { setCurrentMonth(e.target.value); setGlobalMonth(e.target.value); };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "travels"), where("userId", "==", user.uid), where("monthKey", "==", currentMonth)), (snapshot) => setTravels(snapshot.docs.map(d => d.data())));
    return () => unsubscribe();
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "persons"), where("userId", "==", user.uid)), (snapshot) => setPersons(snapshot.docs.map(d => d.data())));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentMonth) return;
    const unsubscribe = onSnapshot(doc(db, "months", `${user.uid}_${currentMonth}`), (docSnap) => setIsFinalized(docSnap.exists() && docSnap.data().isFinalized));
    return () => unsubscribe();
  }, [user, currentMonth]);

  const handleFinalize = async () => {
    if (userSettings?.pinEnabled) {
      if (window.prompt("Security Lock: Enter your 4-digit PIN to finalize this month:") !== userSettings.pin) { alert("❌ Incorrect PIN."); return; }
    } else { if (!window.confirm(`Are you sure you want to finalize ${currentMonth}?`)) return; }
    try { await setDoc(doc(db, "months", `${user.uid}_${currentMonth}`), { userId: user.uid, monthKey: currentMonth, isFinalized: true, finalizedAt: new Date() }); } catch (error) { alert("Failed to finalize month."); }
  };

  const handleMonthlyExport = () => {
    if (travels.length === 0) return alert("No data to export for this month.");
    let csvContent = "data:text/csv;charset=utf-8,Date,Status,Morning Method,Morning Amount,Evening Method,Evening Amount,Total Amount\n";
    const sorted = [...travels].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(t => {
      const row = `${t.date},${t.isNotGoing ? 'Not Going' : 'Traveled'},${t.morning?.method || '-'},${t.morning?.amount || 0},${t.evening?.method || '-'},${t.evening?.amount || 0},${t.totalAmount || 0}`;
      csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `Travels_${currentMonth}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  let totalSpent = 0; let travelDays = 0; let morningTotal = 0; let eveningTotal = 0;
  const methodBreakdown = {}; const settlementTotals = {}; 
  persons.filter(p => p.isStarred).forEach(p => { settlementTotals[p.name] = 0; });

  travels.forEach(t => {
    totalSpent += t.totalAmount || 0;
    if (!t.isNotGoing) {
      travelDays += 1;
      if (t.morning) { morningTotal += t.morning.amount || 0; methodBreakdown[t.morning.method] = (methodBreakdown[t.morning.method] || 0) + (t.morning.amount || 0); if (settlementTotals[t.morning.method] !== undefined) settlementTotals[t.morning.method] += t.morning.amount || 0; }
      if (t.evening) { eveningTotal += t.evening.amount || 0; methodBreakdown[t.evening.method] = (methodBreakdown[t.evening.method] || 0) + (t.evening.amount || 0); if (settlementTotals[t.evening.method] !== undefined) settlementTotals[t.evening.method] += t.evening.amount || 0; }
    }
  });

  // --- NEW: SMART REMINDER LOGIC ---
  const todayObj = new Date();
  const year = todayObj.getFullYear();
  const month = String(todayObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayObj.getDate()).padStart(2, '0');
  const todayFormatted = `${year}-${month}-${day}`;
  
  const currentHour = todayObj.getHours();
  const hasLoggedToday = travels.some(t => t.date === todayFormatted);
  const isViewingCurrentMonth = currentMonth === todayFormatted.substring(0, 7);

  // Trigger banner if: viewing this month, it's >= 8:00 PM (20), and no trip is logged today
  const showReminder = isViewingCurrentMonth && currentHour >= 20 && !hasLoggedToday;

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Dashboard</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "10px 16px", borderRadius: "20px", border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600" }} />
      </div>

      {/* NEW FEATURE: THE DYNAMIC BANNER */}
      {showReminder && (
        <div style={{ backgroundColor: "var(--accent-red-bg)", padding: "16px 20px", borderRadius: "24px", marginBottom: "24px", border: "1px solid var(--accent-red)", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "32px" }}>⏰</span>
          <div>
            <h4 style={{ margin: 0, color: "var(--accent-red)", fontSize: "16px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Action Required</h4>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-main)", fontSize: "14px", fontWeight: "600", lineHeight: "1.4" }}>It's past 8:00 PM. Don't forget to log your travel for today!</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "24px", padding: "0 4px", display: "flex", gap: "10px" }}>
        {isFinalized ? (
          <div style={{ flex: 2, backgroundColor: "var(--accent-green-bg)", color: "var(--accent-green)", padding: "16px", borderRadius: "24px", textAlign: "center", fontWeight: "800", border: "1px solid var(--accent-green)", letterSpacing: "1px" }}>🔒 LOCKED</div>
        ) : (
          <button onClick={handleFinalize} style={{ flex: 2, padding: "16px", backgroundColor: "var(--accent-red)", color: "#fff", border: "none", borderRadius: "24px", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>⚠️ Finalize</button>
        )}
        <button onClick={handleMonthlyExport} style={{ flex: 1, padding: "16px", backgroundColor: "var(--bg-surface)", color: "var(--accent-blue)", border: "1px solid var(--border-strong)", borderRadius: "24px", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>⬇️ CSV</button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid var(--border-light)" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>Total Spent</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "var(--accent-yellow)", fontWeight: "800" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid var(--border-light)" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>Travel Days</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "var(--accent-blue)", fontWeight: "800" }}>{travelDays}</h3>
        </div>
      </div>

      {/* CORRECTED LINE HERE (justifyContent) */}
      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-card)", padding: "20px 24px", borderRadius: "32px", marginBottom: "24px", border: "1px solid var(--border-light)" }}>
        <span style={{color: "var(--text-main)", fontSize: "16px", fontWeight: "800"}}><strong style={{ color: "var(--accent-blue)" }}>☀️ AM:</strong> ₹{morningTotal}</span>
        <span style={{color: "var(--text-main)", fontSize: "16px", fontWeight: "800"}}><strong style={{ color: "var(--accent-purple)" }}>🌙 PM:</strong> ₹{eveningTotal}</span>
      </div>

      <h3 style={{ color: "var(--text-main)", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Settlement Preview</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {Object.keys(settlementTotals).length === 0 ? <p style={{ color: "var(--text-faded)", fontSize: "14px", paddingLeft: "8px", margin: 0 }}>No starred persons found.</p> : Object.entries(settlementTotals).map(([name, amount]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-surface)", padding: "18px 20px", borderRadius: "24px", color: "var(--text-main)", border: "1px solid var(--border-strong)" }}>
            <span style={{fontWeight: "700"}}>⭐ {name}</span><strong style={{ color: "var(--accent-yellow)", fontSize: "16px" }}>₹{amount}</strong>
          </div>
        ))}
      </div>

      <h3 style={{ color: "var(--text-main)", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Method Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.keys(methodBreakdown).length === 0 ? <p style={{ color: "var(--text-faded)", fontSize: "14px", paddingLeft: "8px", margin: 0 }}>No trips logged this month.</p> : Object.entries(methodBreakdown).map(([method, amount]) => (
          <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-card)", padding: "18px 20px", borderRadius: "24px", color: "var(--text-main)", border: "1px solid var(--border-light)" }}>
            <span style={{fontWeight: "700"}}>{method}</span><strong style={{ color: "var(--accent-blue)", fontSize: "16px" }}>₹{amount}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
