import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

// NEW: Added globalMonth and userSettings
export default function Settlements({ user, globalMonth, setGlobalMonth, userSettings }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [persons, setPersons] = useState([]);
  const [allTravels, setAllTravels] = useState([]);
  const [allSettlements, setAllSettlements] = useState([]);

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
    const q = query(collection(db, "persons"), where("userId", "==", user.uid), where("isStarred", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => { setPersons(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => { setAllTravels(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "settlements"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => { setAllSettlements(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsubscribe();
  }, [user]);

  const handleSettleFull = async (personName, pendingAmount) => {
    if (pendingAmount <= 0) return;
    if (window.confirm(`Mark ₹${pendingAmount} as fully settled for ${personName}?`)) {
      try {
        await addDoc(collection(db, "settlements"), {
          userId: user.uid, personName: personName, amount: pendingAmount, monthKey: currentMonth, createdAt: new Date()
        });
      } catch (error) { alert("Failed to save settlement."); }
    }
  };

  const handleUndoSettlement = async (settlementId) => {
    // NEW: Enforce PIN if enabled
    if (userSettings?.pinEnabled) {
      const enteredPin = window.prompt("Security Lock: Enter your 4-digit PIN to undo this payment:");
      if (enteredPin !== userSettings.pin) {
        alert("❌ Incorrect PIN. Action denied.");
        return;
      }
    } else {
      if (!window.confirm("Are you sure you want to undo this payment?")) return;
    }

    try {
      await deleteDoc(doc(db, "settlements", settlementId));
    } catch (error) { alert("Failed to undo settlement."); }
  };

  const calculateLedger = (personName) => {
    const pastTravels = allTravels.filter(t => t.monthKey < currentMonth && !t.isNotGoing);
    let pastOwed = 0;
    pastTravels.forEach(t => {
      if (t.morning?.method === personName) pastOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) pastOwed += Number(t.evening.amount || 0);
    });

    const pastPayments = allSettlements.filter(s => s.monthKey < currentMonth && s.personName === personName);
    const pastPaidTotal = pastPayments.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const carryForward = pastOwed - pastPaidTotal;

    const currentTravels = allTravels.filter(t => t.monthKey === currentMonth && !t.isNotGoing);
    let currentOwed = 0;
    currentTravels.forEach(t => {
      if (t.morning?.method === personName) currentOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) currentOwed += Number(t.evening.amount || 0);
    });

    const currentPayments = allSettlements.filter(s => s.monthKey === currentMonth && s.personName === personName);
    const currentPaidTotal = currentPayments.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const totalPayable = carryForward + currentOwed;
    const finalPending = totalPayable - currentPaidTotal;

    return { carryForward, currentOwed, totalPayable, currentPaidTotal, finalPending, currentPayments };
  };

  return (
    <div style={{ paddingBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white", paddingLeft: "4px" }}>Settlements</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", background: "#222222", color: "white", fontSize: "16px" }} />
      </div>

      {persons.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>No starred persons found.</p>
      )}

      {persons.map(person => {
        const ledger = calculateLedger(person.name);
        const isSettled = ledger.finalPending <= 0 && ledger.totalPayable > 0;

        return (
          <div key={person.name} style={{ backgroundColor: "#111111", padding: "20px", borderRadius: "20px", marginBottom: "16px", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>⭐ {person.name}</h3>
              {isSettled ? (
                <span style={{ backgroundColor: "#065f46", color: "#34d399", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>☑ SETTLED</span>
              ) : (
                <span style={{ backgroundColor: "#7f1d1d", color: "#f87171", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>PENDING</span>
              )}
            </div>

            <div style={{ backgroundColor: "#222222", padding: "16px", borderRadius: "16px", marginBottom: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#aaa" }}>Previous Pending:</span><span>₹{ledger.carryForward}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#aaa" }}>This Month Total:</span><span>₹{ledger.currentOwed}</span></div>
              <hr style={{ border: "0.5px solid #444", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#aaa" }}>Total Payable:</span><strong style={{ color: "white" }}>₹{ledger.totalPayable}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#aaa" }}>Paid This Month:</span><strong style={{ color: "#34d399" }}>- ₹{ledger.currentPaidTotal}</strong></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Current Pending</span>
                <strong style={{ fontSize: "24px", color: ledger.finalPending <= 0 ? "#34d399" : "#fcd34d" }}>₹{ledger.finalPending}</strong>
              </div>
              {ledger.finalPending > 0 && (
                <button onClick={() => handleSettleFull(person.name, ledger.finalPending)} style={{ padding: "12px 16px", backgroundColor: "#a8c7fa", color: "#000", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" }}>
                  Settle Full
                </button>
              )}
            </div>

            {ledger.currentPayments.length > 0 && (
              <div style={{ marginTop: "20px", borderTop: "1px solid #333", paddingTop: "16px" }}>
                <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 8px 0" }}>Payments Recorded:</p>
                {ledger.currentPayments.map(payment => (
                  <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#222222", padding: "10px 14px", borderRadius: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "15px", color: "#34d399", fontWeight: "600" }}>₹{payment.amount} Paid</span>
                    <button onClick={() => handleUndoSettlement(payment.id)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                      Undo ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
