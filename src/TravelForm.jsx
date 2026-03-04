import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TravelForm({ user }) {
  const personAmounts = { "Person A": 100, "Person B": 120 };

  const [date, setDate] = useState("");
  const [officeOption, setOfficeOption] = useState("Person A");
  const [officeAmount, setOfficeAmount] = useState(personAmounts["Person A"]);
  const [returnOption, setReturnOption] = useState("Person A");
  const [returnAmount, setReturnAmount] = useState(personAmounts["Person A"]);
  const [notes, setNotes] = useState("");

  const handleOptionChange = (type, value) => {
    if (type === "office") {
      setOfficeOption(value);
      setOfficeAmount(personAmounts[value] || 0);
    } else {
      setReturnOption(value);
      setReturnAmount(personAmounts[value] || 0);
    }
  };

  const handleSubmit = async () => {
    if (!date || !user) return;

    const officeType = officeOption === "Person A" || officeOption === "Person B" ? "person" : "bus/train";
    const returnType = returnOption === "Person A" || returnOption === "Person B" ? "person" : "bus/train";

    await addDoc(collection(db, "travels"), {
      userId: user.uid,
      date,
      officeTrip: {
        type: officeType,
        name: officeType === "person" ? officeOption : undefined,
        amount: Number(officeAmount) || 0
      },
      returnTrip: {
        type: returnType,
        name: returnType === "person" ? returnOption : undefined,
        amount: Number(returnAmount) || 0
      },
      totalAmount: (Number(officeAmount) || 0) + (Number(returnAmount) || 0),
      notes,
      createdAt: new Date()
    });

    // Reset
    setDate("");
    setOfficeOption("Person A");
    setOfficeAmount(personAmounts["Person A"]);
    setReturnOption("Person A");
    setReturnAmount(personAmounts["Person A"]);
    setNotes("");
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      {/* Office Trip */}
      <label>Office Trip:</label>
      <select
        value={officeOption}
        onChange={(e) => handleOptionChange("office", e.target.value)}
        style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
      >
        <option>Person A</option>
        <option>Person B</option>
        <option>Bus</option>
        <option>Train</option>
      </select>

      {officeOption === "Bus" || officeOption === "Train" ? (
        <input
          type="number"
          placeholder="Amount"
          value={officeAmount}
          onChange={(e) => setOfficeAmount(Number(e.target.value) || 0)}
          style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
        />
      ) : null}

      {/* Return Trip */}
      <label>Return Trip:</label>
      <select
        value={returnOption}
        onChange={(e) => handleOptionChange("return", e.target.value)}
        style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
      >
        <option>Person A</option>
        <option>Person B</option>
        <option>Bus</option>
        <option>Train</option>
      </select>

      {returnOption === "Bus" || returnOption === "Train" ? (
        <input
          type="number"
          placeholder="Amount"
          value={returnAmount}
          onChange={(e) => setReturnAmount(Number(e.target.value) || 0)}
          style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
        />
      ) : null}

      {/* Notes */}
      <input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <div>Total: ₹{(Number(officeAmount) || 0) + (Number(returnAmount) || 0)}</div>

      <button
        onClick={handleSubmit}
        style={{ width: "100%", padding: "10px", marginTop: "8px" }}
      >
        Add Travel
      </button>
    </div>
  );
}
