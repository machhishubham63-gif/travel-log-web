import { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TravelForm({ refresh }) {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [expense, setExpense] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!location || !date) return;

    await addDoc(collection(db, "travels"), {
      userId: user.uid
      location,
      date,
      expense: Number(expense) || 0,
      notes,
      createdAt: new Date()
    });

    setLocation("");
    setDate("");
    setExpense("");
    setNotes("");

    refresh();
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <input
        placeholder="Expense"
        type="number"
        value={expense}
        onChange={(e) => setExpense(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <button
        onClick={handleSubmit}
        style={{ width: "100%", padding: "10px" }}
      >
        Add Travel
      </button>
    </div>
  );
}
