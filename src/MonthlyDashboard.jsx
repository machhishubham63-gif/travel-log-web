import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

export default function MonthlyDashboard({ user, globalMonth, setGlobalMonth, userSettings }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    if (globalMonth && globalMonth !== currentMonth) setCurrentMonth(globalMonth);
  }, [globalMonth]);

  const handleMonthChange = (e) => {
    setCurrentMonth(e.target.value);
    setGlobalMonth(e.target.value);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid), where("monthKey", "==", currentMonth));
    const unsubscribe = onSnapshot(q, (snapshot) => { setTravels(snapshot.docs.map(d => d.data())); });
    return () => unsubscribe();
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => { setPersons(snapshot.docs.map(d => d.data())); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentMonth) return;
    const monthDocId = `${user.uid}_${currentMonth}`;
    const unsubscribe = onSnapshot(doc(db, "months", monthDocId), (docSnap) => {
      setIsFinalized(docSnap.exists() && docSnap.data().isFinalized);
    });
    return () => unsubscribe();
  }, [user, currentMonth]);

  const handleFinalize = async () => {
    if (userSettings?.pinEnabled) {
      const enteredPin = window.prompt("Security Lock: Enter your 4-digit PIN to finalize this month:");
      if (enteredPin !== userSettings.pin) { alert("❌ Incorrect PIN."); return; }
    } else {
      if (!window.confirm(`Are you sure you want to finalize ${currentMonth}?`)) return;
    }
    try {
      await setDoc(doc(db, "months", `${user.uid}_${currentMonth}`), {
        userId: user.uid, monthKey: currentMonth, isFinalized: true, finalizedAt: new Date()
      });
    } catch (error) { alert("Failed to finalize month."); }
  };

  let totalSpent = 0; let travelDays = 0; let morningTotal = 0; let eveningTotal = 0;
  const methodBreakdown = {}; const settlementTotals = {}; 
  persons.filter(p => p.isStarred).forEach(p => { settlementTotals[p.name] = 0; });

  travels.forEach(t => {
    totalSpent += t.totalAmount || 0;
    if (!t.isNotGoing) {
      travelDays += 1;
      if (t.morning) {
        morningTotal += t.morning.amount || 0;
        methodBreakdown[t.morning.method] = (methodBreakdown[t.morning.method] || 0) + (t.morning.amount || 0);
        if (settlementTotals[t.morning.method] !== undefined) settlementTotals[t.morning.method] += t.morning.amount || 0;
      }
      if (t.evening) {
        eveningTotal += t.evening.amount || 0;
        methodBreakdown[t.evening.method] = (methodBreakdown[t.evening.method] || 0) + (t.evening.amount || 0);
        if (settlementTotals[t.evening.method] !== undefined) settlementTotals[t.evening.method] += t.evening.amount || 0;
      }
    }
  });

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Dashboard</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "10px 16px", borderRadius: "20px", border: "1px solid #333", background: "#1A1A1A", color: "white", fontSize: "16px", fontWeight: "600" }} />
      </div>

      <div style={{ marginBottom: "24px", padding: "0 4px" }}>
        {isFinalized ? (
          <div style={{ backgroundColor: "#69f0ae15", color: "#69f0ae", padding: "16px", borderRadius: "24px", textAlign: "center", fontWeight: "800", border: "1px solid #69f0ae50", letterSpacing: "1px" }}>
            🔒 MONTH LOCKED
          </div>
        ) : (
          <button onClick={handleFinalize} style={{ width: "100%", padding: "16px", backgroundColor: "#ff5252", color: "#fff", border: "none", borderRadius: "24px", fontWeight: "800", fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 15px rgba(255, 82, 82, 0.3)" }}>
            ⚠️ Finalize Month (Lock)
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid #222" }}>
          <p style={{ margin: "0 0 8px 0", color: "#888", fontSize: "13px", fontWeight: "700", textTransform: "uppercase" }}>Total Spent</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "#ffb74d", fontWeight: "800" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid #222" }}>
          <p style={{ margin: "0 0 8px 0", color: "#888", fontSize: "13px", fontWeight: "700", textTransform: "uppercase" }}>Travel Days</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "#448aff", fontWeight: "800" }}>{travelDays}</h3>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "20px 24px", borderRadius: "32px", marginBottom: "24px", border: "1px solid #222" }}>
        <span style={{color: "white", fontSize: "16px", fontWeight: "700"}}><strong style={{ color: "#448aff" }}>☀️ AM:</strong> ₹{morningTotal}</span>
        <span style={{color: "white", fontSize: "16px", fontWeight: "700"}}><strong style={{ color: "#b388ff" }}>🌙 PM:</strong> ₹{eveningTotal}</span>
      </div>

      <h3 style={{ color: "white", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Settlement Preview</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {Object.keys(settlementTotals).length === 0 ? (
          <p style={{ color: "#666", fontSize: "14px", paddingLeft: "8px", margin: 0 }}>No starred persons found.</p>
        ) : (
          Object.entries(settlementTotals).map(([name, amount]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#1A1A1A", padding: "18px 20px", borderRadius: "24px", color: "white", border: "1px solid #222" }}>
              <span style={{fontWeight: "600"}}>⭐ {name}</span><strong style={{ color: "#ffd740", fontSize: "16px" }}>₹{amount}</strong>
            </div>
          ))
        )}
      </div>

      <h3 style={{ color: "white", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Method Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.keys(methodBreakdown).length === 0 ? (
          <p style={{ color: "#666", fontSize: "14px", paddingLeft: "8px", margin: 0 }}>No trips logged this month.</p>
        ) : (
          Object.entries(methodBreakdown).map(([method, amount]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "18px 20px", borderRadius: "24px", color: "white", border: "1px solid #222" }}>
              <span style={{fontWeight: "600"}}>{method}</span><strong style={{ color: "#448aff", fontSize: "16px" }}>₹{amount}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
