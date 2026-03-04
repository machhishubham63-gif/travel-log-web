import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TravelForm({ user }) {
  // Preset amounts for Person A and Person B
  const personAmounts = {
    "Person A": 100, // example fixed amount
    "Person B": 120
  };

  const [date, setDate] = useState("");
  const [officeType, setOfficeType] = useState("person"); // "person" or "bus/train"
  const [officePerson, setOfficePerson] = useState("Person A");
  const [officeTransport, setOfficeTransport] = useState("person");
  const [officeAmount, setOfficeAmount] = useState(personAmounts[officePerson] || 0);

  const [returnType, setReturnType] = useState("person");
  const [returnPerson, setReturnPerson] = useState("Person A");
  const [returnTransport, setReturnTransport] = useState("person");
  const [returnAmount, setReturnAmount] = useState(personAmounts[returnPerson] || 0);

  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!date) return;

    const totalAmount = (officeAmount || 0) + (returnAmount || 0);

    await addDoc(collection(db, "travels"), {
      userId: user.uid,
      date,
      officeTrip: {
        type: officeType === "person" ? "person" : "bus/train",
        name: officeType === "person" ? officePerson : undefined,
        amount: Number(officeAmount) || 0
      },
      returnTrip: {
        type: returnType === "person" ? "person" : "bus/train",
        name: returnType === "person" ? returnPerson : undefined,
        amount: Number(returnAmount) || 0
      },
      totalAmount,
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

  const handleOfficePersonChange = (person) => {
    setOfficePerson(person);
    setOfficeAmount(personAmounts[person] || 0);
  };

  const handleReturnPersonChange = (person) => {
    setReturnPerson(person);
    setReturnAmount(personAmounts[person] || 0);
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
      <div style={{ marginBottom: "8px" }}>
        <label>Office Trip:</label>
        <select
          value={officeType}
          onChange={(e) => setOfficeType(e.target.value)}
          style={{ width: "48%", marginRight: "4%", padding: "6px" }}
        >
          <option value="person">Person</option>
          <option value="bus/train">Bus/Train</option>
        </select>

        {officeType === "person" ? (
          <select
            value={officePerson}
            onChange={(e) => handleOfficePersonChange(e.target.value)}
            style={{ width: "48%", padding: "6px" }}
          >
            <option value="Person A">Person A</option>
            <option value="Person B">Person B</option>
          </select>
        ) : null}

        <input
          type="number"
          placeholder="Amount"
          value={officeAmount}
          onChange={(e) => setOfficeAmount(Number(e.target.value))}
          style={{ width: "100%", padding: "6px", marginTop: "4px" }}
        />
      </div>

      {/* Return Trip */}
      <div style={{ marginBottom: "8px" }}>
        <label>Return Trip:</label>
        <select
          value={returnType}
          onChange={(e) => setReturnType(e.target.value)}
          style={{ width: "48%", marginRight: "4%", padding: "6px" }}
        >
          <option value="person">Person</option>
          <option value="bus/train">Bus/Train</option>
        </select>

        {returnType === "person" ? (
          <select
            value={returnPerson}
            onChange={(e) => handleReturnPersonChange(e.target.value)}
            style={{ width: "48%", padding: "6px" }}
          >
            <option value="Person A">Person A</option>
            <option value="Person B">Person B</option>
          </select>
        ) : null}

        <input
          type="number"
          placeholder="Amount"
          value={returnAmount}
          onChange={(e) => setReturnAmount(Number(e.target.value))}
          style={{ width: "100%", padding: "6px", marginTop: "4px" }}
        />
      </div>

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
