import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

// NEW: Added globalMonth and userSettings
export default function MonthlyDashboard({ user, globalMonth, setGlobalMonth, userSettings }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);

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
    // NEW: Enforce PIN if enabled
    if (userSettings?.pinEnabled) {
      const enteredPin = window.prompt("Security Lock: Enter your 4-digit PIN to finalize this month:");
      if (enteredPin !== userSettings.pin) {
        alert("❌ Incorrect PIN. Action denied.");
        return;
      }
    } else {
      if (!window.confirm(`Are you absolutely sure you want to finalize ${currentMonth}?`)) return;
    }

    try {
      const monthDocId = `${user.uid}_${currentMonth}`;
      await setDoc(doc(db, "months", monthDocId), {
        userId: user.uid, monthKey: currentMonth, isFinalized: true, finalizedAt: new Date()
      });
      alert(`${currentMonth} has been permanently locked.`);
    } catch (error) {
      alert("Failed to finalize month. Check your connection.");
    }
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
    <div style={{ paddingBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white", paddingLeft: "4px" }}>Dashboard</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", background: "#222222", color: "white", fontSize: "16px" }} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        {isFinalized ? (
          <div style={{ backgroundColor: "#064e3b", color: "#34d399", padding: "16px", borderRadius: "16px", textAlign: "center", fontWeight: "bold", border: "1px solid #059669" }}>
            🔒 Month Locked & Finalized
          </div>
        ) : (
          <button onClick={handleFinalize} style={{ width: "100%", padding: "16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "16px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
            ⚠️ Finalize Month (Lock)
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "16px", borderRadius: "20px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Total Spent</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#fca5a5" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "16px", borderRadius: "20px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Travel Days</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#a8c7fa" }}>{travelDays}</h3>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "16px", borderRadius: "20px", marginBottom: "20px" }}>
        <span style={{color: "white"}}><strong style={{ color: "#a8c7fa" }}>☀️ AM:</strong> ₹{morningTotal}</span>
        <span style={{color: "white"}}><strong style={{ color: "#f9a8d4" }}>🌙 PM:</strong> ₹{eveningTotal}</span>
      </div>

      <h3 style={{ color: "white", fontSize: "16px", marginBottom: "12px", paddingLeft: "4px" }}>Settlement Preview</h3>
      {Object.keys(settlementTotals).length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px", paddingLeft: "4px" }}>No starred persons found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
          {Object.entries(settlementTotals).map(([name, amount]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#222222", padding: "14px", borderRadius: "16px", color: "white" }}>
              <span>⭐ {name}</span><strong style={{ color: "#fcd34d" }}>₹{amount}</strong>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ color: "white", fontSize: "16px", marginBottom: "12px", paddingLeft: "4px" }}>Method Breakdown</h3>
      {Object.keys(methodBreakdown).length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px", paddingLeft: "4px" }}>No trips logged this month.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(methodBreakdown).map(([method, amount]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "14px", borderRadius: "16px", color: "white" }}>
              <span>{method}</span><strong style={{ color: "#a8c7fa" }}>₹{amount}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
