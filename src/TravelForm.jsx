import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, onSnapshot, doc, getDocs } from "firebase/firestore"; // Added getDocs

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentMonthKey) return;
    const monthDocId = `${user.uid}_${currentMonthKey}`;
    const unsubscribe = onSnapshot(doc(db, "months", monthDocId), (docSnap) => {
      setIsMonthLocked(docSnap.exists() && docSnap.data().isFinalized);
    });
    return () => unsubscribe();
  }, [user, currentMonthKey]);

  const handleMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;

    if (timeOfDay === "morning") {
      setMorningMethod(selectedMethod);
      setMorningAmount(amountToSet);
    } else {
      setEveningMethod(selectedMethod);
      setEveningAmount(amountToSet);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !user || isMonthLocked) return; 

    try {
      // NEW: Check for duplicate entry for this exact date
      const duplicateCheckQuery = query(
        collection(db, "travels"),
        where("userId", "==", user.uid),
        where("date", "==", date)
      );
      
      const duplicateSnapshot = await getDocs(duplicateCheckQuery);
      
      if (!duplicateSnapshot.empty) {
        alert("⚠️ You already have an entry for this date! Please go to the History tab to edit it.");
        return; // Stop the save process
      }

      // If no duplicate, proceed to save
      await addDoc(collection(db, "travels"), {
        userId: user.uid,
        date: date,
        monthKey: currentMonthKey,
        isNotGoing: isNotGoing,
        morning: isNotGoing ? null : {
          method: morningMethod,
          amount: Number(morningAmount) || 0,
          note: morningNote
        },
        evening: isNotGoing ? null : {
          method: eveningMethod,
          amount: Number(eveningAmount) || 0,
          note: eveningNote
        },
        totalAmount: isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0),
        createdAt: new Date(),
      });

      alert("Travel saved successfully!");
      setIsNotGoing(false);
      setMorningMethod("Own Vehicle"); setMorningAmount(0); setMorningNote("");
      setEveningMethod("Own Vehicle"); setEveningAmount(0); setEveningNote("");
      
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save travel entry.");
    }
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];

  // Android 15 / Material 3 Style Constants
  const cardStyle = { backgroundColor: "#111111", padding: "16px", borderRadius: "20px", marginBottom: "16px" };
  const inputStyle = { width: "100%", padding: "12px", marginBottom: "8px", boxSizing: "border-box", borderRadius: "12px", border: "none", backgroundColor: "#222222", color: "white", fontSize: "16px" };

  return (
    <div style={{ backgroundColor: "#000000", padding: "4px", color: "white", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, fontSize: "22px", fontWeight: "600", paddingLeft: "4px" }}>Add Daily Entry</h3>
      <form onSubmit={handleSubmit}>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: isNotGoing ? "#7f1d1d" : "#222222", color: isNotGoing ? "#fca5a5" : "white", padding: "0 16px", borderRadius: "12px", fontWeight: "500" }}>
            <input type="checkbox" checked={isNotGoing} onChange={(e) => setIsNotGoing(e.target.checked)} style={{ marginRight: "8px", accentColor: "#ef4444" }} />
            Not Going
          </label>
        </div>

        {!isNotGoing && (
          <>
            <div style={cardStyle}>
              <h4 style={{ margin: "0 0 12px 0", color: "#a8c7fa", fontSize: "16px" }}>☀️ Morning</h4>
              <select value={morningMethod} onChange={(e) => handleMethodChange("morning", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="number" placeholder="Amount (₹)" value={morningAmount} onChange={(e) => setMorningAmount(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="text" placeholder="Note (opt)" value={morningNote} onChange={(e) => setMorningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
              </div>
            </div>

            <div style={cardStyle}>
              <h4 style={{ margin: "0 0 12px 0", color: "#f9a8d4", fontSize: "16px" }}>🌙 Evening</h4>
              <select value={eveningMethod} onChange={(e) => handleMethodChange("evening", e.target.value)} style={inputStyle}>
                {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="number" placeholder="Amount (₹)" value={eveningAmount} onChange={(e) => setEveningAmount(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="text" placeholder="Note (opt)" value={eveningNote} onChange={(e) => setEveningNote(e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", padding: "0 4px" }}>
          <strong style={{ fontSize: "20px", fontWeight: "700" }}>
            Total: ₹{isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0)}
          </strong>
          
          {isMonthLocked ? (
            <div style={{ padding: "12px 20px", backgroundColor: "#064e3b", color: "#34d399", borderRadius: "24px", fontSize: "14px", fontWeight: "bold" }}>
              🔒 Locked
            </div>
          ) : (
            <button type="submit" style={{ padding: "14px 24px", backgroundColor: "#a8c7fa", color: "#000000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
              Save Entry
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
