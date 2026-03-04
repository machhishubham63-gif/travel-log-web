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
    const unsubscribe = onSnapshot(q, (snapshot) => setPersons(snapshot.docs.map(d => d.data())));
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

  // NEW FEATURE: Quick Load Last Trip
  const handleQuickLoad = () => {
    const saved = localStorage.getItem("lastSavedTrip");
    if (saved) {
      const data = JSON.parse(saved);
      setIsNotGoing(data.isNotGoing);
      setMorningMethod(data.morningMethod); setMorningAmount(data.morningAmount); setMorningNote(data.morningNote);
      setEveningMethod(data.eveningMethod); setEveningAmount(data.eveningAmount); setEveningNote(data.eveningNote);
    } else {
      alert("No previous trip saved yet!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !user || isMonthLocked) return; 
    try {
      const duplicateSnap = await getDocs(query(collection(db, "travels"), where("userId", "==", user.uid), where("date", "==", date)));
      if (!duplicateSnap.empty) { alert("⚠️ You already have an entry for this date!"); return; }

      await addDoc(collection(db, "travels"), {
        userId: user.uid, date: date, monthKey: currentMonthKey, isNotGoing: isNotGoing,
        morning: isNotGoing ? null : { method: morningMethod, amount: Number(morningAmount) || 0, note: morningNote },
        evening: isNotGoing ? null : { method: eveningMethod, amount: Number(eveningAmount) || 0, note: eveningNote },
        totalAmount: isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0),
        createdAt: new Date(),
      });

      // Save to local storage for the "Quick Load" feature
      localStorage.setItem("lastSavedTrip", JSON.stringify({ isNotGoing, morningMethod, morningAmount, morningNote, eveningMethod, eveningAmount, eveningNote }));

      alert("Travel saved successfully!");
      setIsNotGoing(false); setMorningMethod("Own Vehicle"); setMorningAmount(0); setMorningNote("");
      setEveningMethod("Own Vehicle"); setEveningAmount(0); setEveningNote("");
    } catch (error) { alert("Failed to save travel entry."); }
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];
  const inputStyle = { width: "100%", padding: "16px", marginBottom: "12px", boxSizing: "border-box", borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Add Entry</h2>
        <button onClick={handleQuickLoad} style={{ padding: "8px 16px", backgroundColor: "var(--bg-surface)", color: "var(--accent-blue)", border: "1px solid var(--border-strong)", borderRadius: "20px", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}>⚡ Quick Fill</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", padding: "0 4px" }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0, backgroundColor: "var(--bg-surface)" }} />
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: isNotGoing ? "var(--accent-red-bg)" : "var(--bg-surface)", color: isNotGoing ? "var(--accent-red)" : "var(--text-main)", padding: "0 16px", borderRadius: "16px", fontWeight: "700", border: isNotGoing ? "1px solid var(--accent-red)" : "1px solid var(--border-strong)", transition: "all 0.2s" }}>
            <input type="checkbox" checked={isNotGoing} onChange={(e) => setIsNotGoing(e.target.checked)} style={{ marginRight: "10px", accentColor: "var(--accent-red)", width: "18px", height: "18px" }} />
            Not Going
          </label>
        </div>

        {!isNotGoing && (
          <div style={{ animation: "fadeIn 0.3s" }}>
            <div style={{ backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "var(--accent-blue)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>☀️ Morning</h4>
              <select value={morningMethod} onChange={(e) => handleMethodChange("morning", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="number" placeholder="₹" value={morningAmount} onChange={(e) => setMorningAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <input type="text" placeholder="Note (opt)" value={morningNote} onChange={(e) => setMorningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", marginBottom: "24px", border: "1px solid var(--border-light)" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "var(--accent-purple)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>🌙 Evening</h4>
              <select value={eveningMethod} onChange={(e) => handleMethodChange("evening", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="number" placeholder="₹" value={eveningAmount} onChange={(e) => setEveningAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <input type="text" placeholder="Note (opt)" value={eveningNote} onChange={(e) => setEveningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5, marginBottom: 0 }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: "var(--bg-surface)", padding: "20px 24px", borderRadius: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-strong)" }}>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Daily Total</span>
            <strong style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)" }}>
              ₹{isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0)}
            </strong>
          </div>
          
          {isMonthLocked ? (
            <div style={{ padding: "14px 24px", backgroundColor: "var(--accent-green-bg)", color: "var(--accent-green)", borderRadius: "24px", fontSize: "14px", fontWeight: "800", border: "1px solid var(--accent-green)" }}>🔒 LOCKED</div>
          ) : (
            <button type="submit" style={{ padding: "16px 32px", backgroundColor: "var(--accent-green)", color: "#000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(105, 240, 174, 0.3)" }}>Save</button>
          )}
        </div>
      </form>
    </div>
  );
}
