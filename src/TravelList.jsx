import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "travels"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      setTravels(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "travels", id));
  };

  const handleEdit = async (travel) => {
    const newLocation = prompt("Update location", travel.location);
    const newDate = prompt("Update date", travel.date);
    const newExpense = prompt("Update expense", travel.expense);
    const newNotes = prompt("Update notes", travel.notes);

    if (newLocation && newDate) {
      await updateDoc(doc(db, "travels", travel.id), {
        location: newLocation,
        date: newDate,
        expense: Number(newExpense) || 0,
        notes: newNotes
      });
    }
  };

  // Apply filter
  let displayedTravels = travels.filter((t) =>
    t.location.toLowerCase().includes(filterText.toLowerCase())
  );

  // Apply sort
  displayedTravels.sort((a, b) =>
    sortNewestFirst
      ? b.createdAt?.toMillis() - a.createdAt?.toMillis()
      : a.createdAt?.toMillis() - b.createdAt?.toMillis()
  );

  const totalExpense = displayedTravels.reduce(
    (sum, item) => sum + (item.expense || 0),
    0
  );

  return (
    <div>
      {/* Filter and Sort Controls */}
      <div style={{ marginBottom: "15px" }}>
        <input
          placeholder="Filter by location"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: "70%", padding: "6px", marginRight: "10px" }}
        />
        <button
          onClick={() => setSortNewestFirst(!sortNewestFirst)}
          style={{ padding: "6px" }}
        >
          Sort: {sortNewestFirst ? "Newest First" : "Oldest First"}
        </button>
      </div>

      <div
        style={{
          background: "#2c2c2c",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          textAlign: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px"
        }}
      >
        Total Travel Expense: ₹{totalExpense}
      </div>

      {displayedTravels.map((travel) => (
        <div
          key={travel.id}
          style={{
            background: "#1e1e1e",
            padding: "15px",
            marginBottom: "12px",
            borderRadius: "10px",
            color: "white"
          }}
        >
          <h3>{travel.location}</h3>
          <p>Date: {travel.date}</p>
          <p>Expense: ₹{travel.expense}</p>
          <p>{travel.notes}</p>

          <button
            onClick={() => handleEdit(travel)}
            style={{
              marginTop: "10px",
              padding: "8px",
              width: "48%",
              marginRight: "4%",
              background: "#4caf50",
              border: "none",
              borderRadius: "6px",
              color: "white"
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(travel.id)}
            style={{
              marginTop: "10px",
              padding: "8px",
              width: "48%",
              background: "#ff4444",
              border: "none",
              borderRadius: "6px",
              color: "white"
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
