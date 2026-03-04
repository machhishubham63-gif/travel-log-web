import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";

export default function TravelForm({ user }) {
  const [persons, setPersons] = useState([]);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Defaults to today (YYYY-MM-DD)
  const [isNotGoing, setIsNotGoing] = useState(false);

  // Morning State
  const [morningMethod, setMorningMethod] = useState("Own Vehicle");
  const [morningAmount, setMorningAmount] = useState(0);
  const [morningNote, setMorningNote] = useState("");

  // Evening State
  const [eveningMethod, setEveningMethod] = useState("Own Vehicle");
  const [eveningAmount, setEveningAmount] = useState(0);
  const [eveningNote, setEveningNote] = useState("");

  // 1. Fetch saved persons from the database
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPersons = snapshot.docs.map(d => d.data());
      setPersons(fetchedPersons);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Handle dropdown changes & auto-fill default amounts
  const handleMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    
    // Check if the selected method is one of our saved persons
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) {
      amountToSet = foundPerson.defaultAmount;
    }

    if (timeOfDay === "morning") {
      setMorningMethod(selectedMethod);
      setMorningAmount(amountToSet);
    } else {
      setEveningMethod(selectedMethod);
      setEveningAmount(amountToSet);
    }
  };

  // 3. Save to Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !user) return;

    // Create a month key (e.g., "2026-03") for the settlement system later
    const monthKey = date.substring(0, 7); 

    try {
      await addDoc(collection(db, "travels"), {
        userId: user.uid,
        date: date,
        monthKey: monthKey,
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
      
      // Reset form fields (keep the date as is for convenience)
      setIsNotGoing(false);
      setMorningMethod("Own Vehicle"); setMorningAmount(0); setMorningNote("");
      setEveningMethod("Own Vehicle"); setEveningAmount(0); setEveningNote("");
      
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save travel entry.");
    }
  };

  // List of base methods + dynamically added persons
  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];

  return (
    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "10px", color: "white", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0 }}>Add Daily Entry</h3>
      <form onSubmit={handleSubmit}>
        
        {/* Date & Not Going Toggle */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
          />
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: isNotGoing ? "#ef4444" : "#333", padding: "8px 12px", borderRadius: "4px" }}>
            <input
              type="checkbox"
              checked={isNotGoing}
              onChange={(e) => setIsNotGoing(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Not Going
          </label>
        </div>

        {/* Morning & Evening Sections (Hidden if Not Going) */}
        {!isNotGoing && (
          <>
            {/* MORNING SECTION */}
            <div style={{ backgroundColor: "#2d2d2d", padding: "10px", borderRadius: "6px", marginBottom: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa" }}>☀️ Morning Entry</h4>
              
              <select 
                value={morningMethod} 
                onChange={(e) => handleMethodChange("morning", e.target.value)}
                style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}
              >
                {availableMethods.map((method, idx) => (
                  <option key={idx} value={method}>{method}</option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={morningAmount}
                  onChange={(e) => setMorningAmount(e.target.value)}
                  style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={morningNote}
                  onChange={(e) => setMorningNote(e.target.value)}
                  style={{ flex: 2, padding: "8px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* EVENING SECTION */}
            <div style={{ backgroundColor: "#2d2d2d", padding: "10px", borderRadius: "6px", marginBottom: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#f472b6" }}>🌙 Evening Entry</h4>
              
              <select 
                value={eveningMethod} 
                onChange={(e) => handleMethodChange("evening", e.target.value)}
                style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}
              >
                {availableMethods.map((method, idx) => (
                  <option key={idx} value={method}>{method}</option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={eveningAmount}
                  onChange={(e) => setEveningAmount(e.target.value)}
                  style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={eveningNote}
                  onChange={(e) => setEveningNote(e.target.value)}
                  style={{ flex: 2, padding: "8px", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </>
        )}

        {/* Total & Submit */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
          <strong style={{ fontSize: "18px" }}>
            Total: ₹{isNotGoing ? 0 : (Number(morningAmount) || 0) + (Number(eveningAmount) || 0)}
          </strong>
          
          <button 
            type="submit" 
            style={{ padding: "10px 20px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer" }}
          >
            Save Entry
          </button>
        </div>

      </form>
    </div>
  );
}
