import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";

export default function MonthlyDashboard({ user }) {
  const [monthKey, setMonthKey] = useState(new Date().toISOString().substring(0, 7));
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false); // NEW: Track lock status

  // 1. Fetch Travels
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "travels"),
      where("userId", "==", user.uid),
      where("monthKey", "==", monthKey)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTravels(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user, monthKey]);

  // 2. Fetch Persons
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. NEW: Fetch Month Finalization Status
  useEffect(() => {
    if (!user) return;
    // We use a specific ID format for the month document: "user123_2026-03"
    const monthDocId = `${user.uid}_${monthKey}`;
    const unsubscribe = onSnapshot(doc(db, "months", monthDocId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().isFinalized) {
        setIsFinalized(true);
      } else {
        setIsFinalized(false);
      }
    });
    return () => unsubscribe();
  }, [user, monthKey]);

  // NEW: Handle Finalize Month
  const handleFinalize = async () => {
    if (window.confirm(`Are you absolutely sure you want to finalize ${monthKey}? You will NOT be able to add, edit, or delete trips for this month once it is locked.`)) {
      try {
        const monthDocId = `${user.uid}_${monthKey}`;
        await setDoc(doc(db, "months", monthDocId), {
          userId: user.uid,
          monthKey: monthKey,
          isFinalized: true,
          finalizedAt: new Date()
        });
        alert(`${monthKey} has been permanently locked.`);
      } catch (error) {
        console.error("Error finalizing month:", error);
        alert("Failed to finalize month. Check your connection.");
      }
    }
  };

  // --- CALCULATIONS ---
  let totalSpent = 0;
  let travelDays = 0;
  let morningTotal = 0;
  let eveningTotal = 0;
  const methodBreakdown = {};
  const settlementTotals = {}; 

  persons.filter(p => p.isStarred).forEach(p => {
    settlementTotals[p.name] = 0;
  });

  travels.forEach(t => {
    totalSpent += t.totalAmount || 0;
    if (!t.isNotGoing) {
      travelDays += 1;
      
      if (t.morning) {
        morningTotal += t.morning.amount || 0;
        methodBreakdown[t.morning.method] = (methodBreakdown[t.morning.method] || 0) + (t.morning.amount || 0);
        if (settlementTotals[t.morning.method] !== undefined) {
          settlementTotals[t.morning.method] += t.morning.amount || 0;
        }
      }
      
      if (t.evening) {
        eveningTotal += t.evening.amount || 0;
        methodBreakdown[t.evening.method] = (methodBreakdown[t.evening.method] || 0) + (t.evening.amount || 0);
        if (settlementTotals[t.evening.method] !== undefined) {
          settlementTotals[t.evening.method] += t.evening.amount || 0;
        }
      }
    }
  });

  return (
    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "10px", color: "white", marginBottom: "20px" }}>
      
      {/* Header & Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#4caf50" }}>Dashboard</h2>
        <input 
          type="month" 
          value={monthKey} 
          onChange={(e) => setMonthKey(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "white" }}
        />
      </div>

      {/* NEW: Finalization Banner */}
      <div style={{ marginBottom: "20px" }}>
        {isFinalized ? (
          <div style={{ backgroundColor: "#064e3b", color: "#34d399", padding: "12px", borderRadius: "8px", textAlign: "center", fontWeight: "bold", border: "1px solid #059669" }}>
            🔒 Month Locked & Finalized
          </div>
        ) : (
          <button 
            onClick={handleFinalize}
            style={{ width: "100%", padding: "12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            ⚠️ Finalize Month (Lock Entries)
          </button>
        )}
      </div>

      {/* Main Stats Cards */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ flex: 1, backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Total Spent</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#ef4444" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Travel Days</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#3b82f6" }}>{travelDays}</h3>
        </div>
      </div>

      {/* Morning / Evening Split */}
      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#2d2d2d", padding: "12px 15px", borderRadius: "8px", marginBottom: "20px" }}>
        <span><strong style={{ color: "#60a5fa" }}>☀️ Morning:</strong> ₹{morningTotal}</span>
        <span><strong style={{ color: "#f472b6" }}>🌙 Evening:</strong> ₹{eveningTotal}</span>
      </div>

      {/* Settlement Preview */}
      <h3 style={{ borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "12px" }}>Settlement Preview</h3>
      {Object.keys(settlementTotals).length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px" }}>No starred persons found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {Object.entries(settlementTotals).map(([name, amount]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#333", padding: "10px", borderRadius: "6px" }}>
              <span>⭐ {name}</span>
              <strong style={{ color: "#f59e0b" }}>₹{amount}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown by Method */}
      <h3 style={{ borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "12px" }}>Method Breakdown</h3>
      {Object.keys(methodBreakdown).length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px" }}>No trips logged this month.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(methodBreakdown).map(([method, amount]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#2d2d2d", padding: "8px 12px", borderRadius: "6px" }}>
              <span>{method}</span>
              <strong>₹{amount}</strong>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
