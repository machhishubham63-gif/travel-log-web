import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, onSnapshot, doc, getDocs } from "firebase/firestore"; 

export default function TravelForm({ user }) {
  const [persons, setPersons] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNotGoing, setIsNotGoing] = useState(false);
  const [morningMethod, setMorningMethod] = useState("Own Vehicle");
  const [morningAmount, setMorningAmount] = useState(0);
  const [morningNote, setMorningNote] = useState("");
  const [eveningMethod, setEveningMethod] = useState("Own Vehicle");
  const [eveningAmount, setEveningAmount] = useState(0);
  const [eveningNote, setEveningNote] = useState("");

  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const currentMonthKey = date.substring(0, 7);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => { setPersons(snapshot.docs.map(d => d.data())); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentMonthKey) return;
    const unsubscribe = onSnapshot(doc(db, "months", `${user.uid}_${currentMonthKey}`), (docSnap) => {
      setIsMonthLocked(docSnap.exists() && docSnap.data().isFinalized);
    });
    return () => unsubscribe();
  }, [user, currentMonthKey]);

  const handleMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;
    if (timeOfDay === "morning") { setMorningMethod(selectedMethod); setMorningAmount(amountToSet); } 
    else { setEveningMethod(selectedMethod); setEveningAmount(amountToSet); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !user || isMonthLocked) return; 
    try {
      const duplicateSnap = await getDocs(query(collection(db, "travels"), where("userId", "==", user.uid), where("date", "==", date)));
      if (!duplicateSnap.empty) { alert("⚠️ You already have an entry for this date! Edit it in the Calendar or History tab."); return; }

      await addDoc(collection(db, "travels"), {
        userId: user.uid, date: date, monthKey: currentMonthKey, isNotGoing: isNotGoing,
        morning: isNotGoing ? null : { method: morningMethod, amount: Number(morningAmount) || 0, note: morningNote },
        evening: isNotGoing ? null : { method: eveningMethod, amount: Number(eveningAmount) || 0, note: eveningNote },
        totalAmount: isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0),
        createdAt: new Date(),
      });
      alert("Travel saved successfully!");
      setIsNotGoing(false); setMorningMethod("Own Vehicle"); setMorningAmount(0); setMorningNote("");
      setEveningMethod("Own Vehicle"); setEveningAmount(0); setEveningNote("");
    } catch (error) { alert("Failed to save travel entry."); }
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];
  const inputStyle = { width: "100%", padding: "16px", marginBottom: "12px", boxSizing: "border-box", borderRadius: "16px", border: "none", backgroundColor: "#0A0A0A", color: "white", fontSize: "16px", fontWeight: "500" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ margin: "0 0 24px 0", color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>Add Entry</h2>
      <form onSubmit={handleSubmit}>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", padding: "0 4px" }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0, backgroundColor: "#1A1A1A", border: "1px solid #333" }} />
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: isNotGoing ? "#ff525220" : "#1A1A1A", color: isNotGoing ? "#ff8a80" : "white", padding: "0 16px", borderRadius: "16px", fontWeight: "700", border: isNotGoing ? "1px solid #ff525250" : "1px solid #333", transition: "all 0.2s" }}>
            <input type="checkbox" checked={isNotGoing} onChange={(e) => setIsNotGoing(e.target.checked)} style={{ marginRight: "10px", accentColor: "#ff5252", width: "18px", height: "18px" }} />
            Not Going
          </label>
        </div>

        {!isNotGoing && (
          <div style={{ animation: "fadeIn 0.3s" }}>
            <div style={{ backgroundColor: "#111111", padding: "20px", borderRadius: "32px", marginBottom: "20px", border: "1px solid #222" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "#448aff", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>☀️ Morning</h4>
              <select value={morningMethod} onChange={(e) => handleMethodChange("morning", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="number" placeholder="Amount (₹)" value={morningAmount} onChange={(e) => setMorningAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <input type="text" placeholder="Note (opt)" value={morningNote} onChange={(e) => setMorningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ backgroundColor: "#111111", padding: "20px", borderRadius: "32px", marginBottom: "24px", border: "1px solid #222" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "#b388ff", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>🌙 Evening</h4>
              <select value={eveningMethod} onChange={(e) => handleMethodChange("evening", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="number" placeholder="Amount (₹)" value={eveningAmount} onChange={(e) => setEveningAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <input type="text" placeholder="Note (opt)" value={eveningNote} onChange={(e) => setEveningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5, marginBottom: 0 }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: "#1A1A1A", padding: "20px 24px", borderRadius: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #333" }}>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "#888", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Daily Total</span>
            <strong style={{ fontSize: "28px", fontWeight: "800", color: "white" }}>
              ₹{isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0)}
            </strong>
          </div>
          
          {isMonthLocked ? (
            <div style={{ padding: "14px 24px", backgroundColor: "#69f0ae15", color: "#69f0ae", borderRadius: "24px", fontSize: "14px", fontWeight: "800", border: "1px solid #69f0ae50" }}>
              🔒 LOCKED
            </div>
          ) : (
            <button type="submit" style={{ padding: "16px 32px", backgroundColor: "#69f0ae", color: "#000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(105, 240, 174, 0.3)" }}>
              Save
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
