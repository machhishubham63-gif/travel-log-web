import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";

export default function Settlements({ user }) {
  const [monthKey, setMonthKey] = useState(new Date().toISOString().substring(0, 7));
  
  const [persons, setPersons] = useState([]);
  const [allTravels, setAllTravels] = useState([]);
  const [allSettlements, setAllSettlements] = useState([]);

  // 1. Fetch Starred Persons
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid), where("isStarred", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch ALL Travels (needed to calculate past carry-forward balances)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllTravels(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Fetch ALL Payment Settlements
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "settlements"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllSettlements(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // --- HANDLE PAYMENT ---
  const handleSettleFull = async (personName, pendingAmount) => {
    if (pendingAmount <= 0) {
      alert("This balance is already settled!");
      return;
    }
    
    if (window.confirm(`Are you sure you want to mark ₹${pendingAmount} as fully settled for ${personName}?`)) {
      try {
        await addDoc(collection(db, "settlements"), {
          userId: user.uid,
          personName: personName,
          amount: pendingAmount,
          monthKey: monthKey, // Logs the payment against the currently viewed month
          createdAt: new Date()
        });
        alert(`Successfully settled ₹${pendingAmount} with ${personName}!`);
      } catch (error) {
        console.error("Error saving settlement:", error);
        alert("Failed to save settlement. Check your network or database rules.");
      }
    }
  };

  // --- THE ACCOUNTING ENGINE ---
  const calculateLedger = (personName) => {
    // A. Calculate Carry Forward (Everything BEFORE the currently selected monthKey)
    const pastTravels = allTravels.filter(t => t.monthKey < monthKey && !t.isNotGoing);
    let pastOwed = 0;
    pastTravels.forEach(t => {
      if (t.morning?.method === personName) pastOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) pastOwed += Number(t.evening.amount || 0);
    });

    const pastPayments = allSettlements.filter(s => s.monthKey < monthKey && s.personName === personName);
    const pastPaidTotal = pastPayments.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    
    const carryForward = pastOwed - pastPaidTotal;

    // B. Calculate Current Month Owed
    const currentTravels = allTravels.filter(t => t.monthKey === monthKey && !t.isNotGoing);
    let currentOwed = 0;
    currentTravels.forEach(t => {
      if (t.morning?.method === personName) currentOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) currentOwed += Number(t.evening.amount || 0);
    });

    // C. Calculate Current Month Paid
    const currentPayments = allSettlements.filter(s => s.monthKey === monthKey && s.personName === personName);
    const currentPaidTotal = currentPayments.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // D. Final Math
    const totalPayable = carryForward + currentOwed;
    const finalPending = totalPayable - currentPaidTotal;

    return { carryForward, currentOwed, totalPayable, currentPaidTotal, finalPending };
  };

  return (
    <div style={{ paddingBottom: "20px" }}>
      {/* Header & Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white" }}>Settlements</h2>
        <input 
          type="month" 
          value={monthKey} 
          onChange={(e) => setMonthKey(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "white" }}
        />
      </div>

      {persons.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>
          No starred persons found. Go to the 'Persons' tab and star someone to track settlements.
        </p>
      )}

      {persons.map(person => {
        const ledger = calculateLedger(person.name);
        const isSettled = ledger.finalPending <= 0;

        return (
          <div key={person.name} style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "10px", marginBottom: "15px", color: "white" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>⭐ {person.name}</h3>
              {isSettled ? (
                <span style={{ backgroundColor: "#065f46", color: "#34d399", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  ☑ FULLY SETTLED
                </span>
              ) : (
                <span style={{ backgroundColor: "#7f1d1d", color: "#f87171", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  PENDING
                </span>
              )}
            </div>

            <div style={{ backgroundColor: "#2d2d2d", padding: "12px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#aaa" }}>Previous Pending:</span>
                <span>₹{ledger.carryForward}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#aaa" }}>This Month Total:</span>
                <span>₹{ledger.currentOwed}</span>
              </div>
              <hr style={{ border: "0.5px solid #444", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#aaa" }}>Total Payable:</span>
                <strong style={{ color: "white" }}>₹{ledger.totalPayable}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#aaa" }}>Paid This Month:</span>
                <strong style={{ color: "#34d399" }}>- ₹{ledger.currentPaidTotal}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Current Pending</span>
                <strong style={{ fontSize: "22px", color: isSettled ? "#34d399" : "#f59e0b" }}>
                  ₹{ledger.finalPending}
                </strong>
              </div>
              
              {!isSettled && (
                <button 
                  onClick={() => handleSettleFull(person.name, ledger.finalPending)}
                  style={{ padding: "10px 15px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Settle Full Amount
                </button>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
