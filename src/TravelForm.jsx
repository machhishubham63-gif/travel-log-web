import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TravelForm({ user }) {
  const personAmounts = { "Person A": 100, "Person B": 120 };

  const [date, setDate] = useState("");
  const [officeType, setOfficeType] = useState("person");
  const [officePerson, setOfficePerson] = useState("Person A");
  const [officeAmount, setOfficeAmount] = useState(personAmounts["Person A"]);
  const [returnType, setReturnType] = useState("person");
  const [returnPerson, setReturnPerson] = useState("Person A");
  const [returnAmount, setReturnAmount] = useState(personAmounts["Person A"]);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!date || !user) return;

    // Ensure numeric amounts
    const officeAmt = Number(officeAmount) || 0;
    const returnAmt = Number(returnAmount) || 0;

    await addDoc(collection(db, "travels"), {
      userId: user.uid,
      date,
      officeTrip: {
        type: officeType,
        name: officeType === "person" ? officePerson : undefined,
        amount: officeAmt
      },
      returnTrip: {
        type: returnType,
        name: returnType === "person" ? returnPerson : undefined,
        amount: returnAmt
      },
      totalAmount: officeAmt + returnAmt,
      notes,
      createdAt: new Date()
    });

    // Reset form
    setDate("");
    setOfficeType("person");
    setOfficePerson("Person A");
    setOfficeAmount(personAmounts["Person A"]);
    setReturnType("person");
    setReturnPerson("Person A");
    setReturnAmount(personAmounts["Person A"]);
    setNotes("");
  };

  const handleOfficeTypeChange = (type) => {
    setOfficeType(type);
    if (type === "person") {
      setOfficeAmount(personAmounts[officePerson] || 0);
    } else {
      setOfficeAmount(0);
    }
  };

  const handleReturnTypeChange = (type) => {
    setReturnType(type);
    if (type === "person") {
      setReturnAmount(personAmounts[returnPerson] || 0);
    } else {
      setReturnAmount(0);
    }
  };

  const handleOfficePersonChange = (person) => {
    setOfficePerson(person);
    if (officeType === "person") setOfficeAmount(personAmounts[person] || 0);
  };

  const handleReturnPersonChange = (person) => {
    setReturnPerson(person);
    if (returnType === "person") setReturnAmount(personAmounts[person] || 0);
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
        value={officeType}
        onChange={(e) => handleOfficeTypeChange(e.target.value)}
        style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
      >
        <option value="person">Person</option>
        <option value="bus/train">Bus/Train</option>
      </select>

      {officeType === "person" && (
        <select
          value={officePerson}
          onChange={(e) => handleOfficePersonChange(e.target.value)}
          style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
        >
          <option value="Person A">Person A</option>
          <option value="Person B">Person B</option>
        </select>
      )}

      <input
        type="number"
        placeholder="Amount"
        value={officeAmount}
        onChange={(e) => setOfficeAmount(Number(e.target.value) || 0)}
        style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
      />

      {/* Return Trip */}
      <label>Return Trip:</label>
      <select
        value={returnType}
        onChange={(e) => handleReturnTypeChange(e.target.value)}
        style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
      >
        <option value="person">Person</option>
        <option value="bus/train">Bus/Train</option>
      </select>

      {returnType === "person" && (
        <select
          value={returnPerson}
          onChange={(e) => handleReturnPersonChange(e.target.value)}
          style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
        >
          <option value="Person A">Person A</option>
          <option value="Person B">Person B</option>
        </select>
      )}

      <input
        type="number"
        placeholder="Amount"
        value={returnAmount}
        onChange={(e) => setReturnAmount(Number(e.target.value) || 0)}
        style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
      />

      {/* Notes */}
      <input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <div>Total: ₹{(officeAmount || 0) + (returnAmount || 0)}</div>

      <button
        onClick={handleSubmit}
        style={{ width: "100%", padding: "10px", marginTop: "8px" }}
      >
        Add Travel
      </button>
    </div>
  );
}
