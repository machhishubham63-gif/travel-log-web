import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function Settlements({ user, globalMonth, setGlobalMonth, userSettings }) {
  const [currentMonth, setCurrentMonth] = useState(globalMonth || new Date().toISOString().substring(0, 7));
  const [persons, setPersons] = useState([]);
  const [allTravels, setAllTravels] = useState([]);
  const [allSettlements, setAllSettlements] = useState([]);

  useEffect(() => { if (globalMonth && globalMonth !== currentMonth) setCurrentMonth(globalMonth); }, [globalMonth]);

  const handleMonthChange = (e) => { setCurrentMonth(e.target.value); setGlobalMonth(e.target.value); };

  useEffect(() => {
    if (!user) return;
    onSnapshot(query(collection(db, "persons"), where("userId", "==", user.uid), where("isStarred", "==", true)), (snapshot) => setPersons(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, "travels"), where("userId", "==", user.uid)), (snapshot) => setAllTravels(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, "settlements"), where("userId", "==", user.uid)), (snapshot) => setAllSettlements(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleSettleFull = async (personName, pendingAmount) => {
    if (pendingAmount <= 0) return;
    if (window.confirm(`Mark ₹${pendingAmount} as fully settled for ${personName}?`)) {
      try { await addDoc(collection(db, "settlements"), { userId: user.uid, personName: personName, amount: pendingAmount, monthKey: currentMonth, createdAt: new Date() }); } catch (error) { alert("Failed to save settlement."); }
    }
  };

  const handleUndoSettlement = async (settlementId) => {
    if (userSettings?.pinEnabled) {
      if (window.prompt("Security Lock: Enter your 4-digit PIN to undo this payment:") !== userSettings.pin) { alert("❌ Incorrect PIN."); return; }
    } else { if (!window.confirm("Are you sure you want to undo this payment?")) return; }
    try { await deleteDoc(doc(db, "settlements", settlementId)); } catch (error) { alert("Failed to undo."); }
  };

  const calculateLedger = (personName) => {
    const pastTravels = allTravels.filter(t => t.monthKey < currentMonth && !t.isNotGoing);
    let pastOwed = 0;
    pastTravels.forEach(t => {
      if (t.morning?.method === personName) pastOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) pastOwed += Number(t.evening.amount || 0);
    });
    const pastPaidTotal = allSettlements.filter(s => s.monthKey < currentMonth && s.personName === personName).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const carryForward = pastOwed - pastPaidTotal;

    const currentTravels = allTravels.filter(t => t.monthKey === currentMonth && !t.isNotGoing);
    let currentOwed = 0;
    currentTravels.forEach(t => {
      if (t.morning?.method === personName) currentOwed += Number(t.morning.amount || 0);
      if (t.evening?.method === personName) currentOwed += Number(t.evening.amount || 0);
    });
    const currentPayments = allSettlements.filter(s => s.monthKey === currentMonth && s.personName === personName);
    const currentPaidTotal = currentPayments.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    return { carryForward, currentOwed, totalPayable: carryForward + currentOwed, currentPaidTotal, finalPending: (carryForward + currentOwed) - currentPaidTotal, currentPayments };
  };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Pay</h2>
        <input type="month" value={currentMonth} onChange={handleMonthChange} style={{ padding: "10px 16px", borderRadius: "20px", border: "1px solid #333", background: "#1A1A1A", color: "white", fontSize: "16px", fontWeight: "600" }} />
      </div>

      {persons.length === 0 && <p style={{ color: "#666", textAlign: "center", marginTop: "40px", fontWeight: "600" }}>No starred persons found.</p>}

      {persons.map(person => {
        const ledger = calculateLedger(person.name);
        const isSettled = ledger.finalPending <= 0 && ledger.totalPayable > 0;

        return (
          <div key={person.name} style={{ backgroundColor: "#111111", padding: "24px", borderRadius: "32px", marginBottom: "20px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "white", fontWeight: "800" }}>⭐ {person.name}</h3>
              {isSettled ? (
                <span style={{ backgroundColor: "#69f0ae20", color: "#69f0ae", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", border: "1px solid #69f0ae50" }}>☑ SETTLED</span>
              ) : (
                <span style={{ backgroundColor: "#ff525220", color: "#ff8a80", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", border: "1px solid #ff525250" }}>PENDING</span>
              )}
            </div>

            <div style={{ backgroundColor: "#0A0A0A", padding: "20px", borderRadius: "24px", marginBottom: "20px", fontSize: "15px", fontWeight: "600" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><span style={{ color: "#888" }}>Previous Pending</span><span style={{ color: "#ccc" }}>₹{ledger.carryForward}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><span style={{ color: "#888" }}>This Month Total</span><span style={{ color: "#ccc" }}>₹{ledger.currentOwed}</span></div>
              <hr style={{ border: "0", borderTop: "1px dashed #333", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}><span style={{ color: "#888" }}>Total Payable</span><strong style={{ color: "white", fontSize: "16px" }}>₹{ledger.totalPayable}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#888" }}>Paid This Month</span><strong style={{ color: "#69f0ae" }}>- ₹{ledger.currentPaidTotal}</strong></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", color: "#888", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Current Pending</span>
                <strong style={{ fontSize: "28px", fontWeight: "800", color: ledger.finalPending <= 0 ? "#69f0ae" : "#ffd740" }}>₹{ledger.finalPending}</strong>
              </div>
              {ledger.finalPending > 0 && (
                <button onClick={() => handleSettleFull(person.name, ledger.finalPending)} style={{ padding: "14px 20px", backgroundColor: "#448aff", color: "#fff", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "800", fontSize: "15px", boxShadow: "0 4px 15px rgba(68, 138, 255, 0.3)" }}>
                  Settle Full
                </button>
              )}
            </div>

            {ledger.currentPayments.length > 0 && (
              <div style={{ marginTop: "24px", borderTop: "1px solid #222", paddingTop: "20px" }}>
                <p style={{ fontSize: "13px", color: "#888", fontWeight: "700", textTransform: "uppercase", margin: "0 0 12px 0" }}>Payments Recorded</p>
                {ledger.currentPayments.map(payment => (
                  <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1A1A1A", padding: "12px 16px", borderRadius: "16px", marginBottom: "8px", border: "1px solid #333" }}>
                    <span style={{ fontSize: "15px", color: "#69f0ae", fontWeight: "700" }}>₹{payment.amount} Paid</span>
                    <button onClick={() => handleUndoSettlement(payment.id)} style={{ background: "transparent", border: "1px solid #ff5252", color: "#ff5252", borderRadius: "12px", padding: "8px 12px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>
                      Undo ✖
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
