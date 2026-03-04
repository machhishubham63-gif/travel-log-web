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
  const [editingTravel, setEditingTravel] = useState(null); // Travel being edited
  const [editForm, setEditForm] = useState({
    location: "",
    date: "",
    expense: "",
    notes: ""
  });

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

  const openEdit = (travel) => {
    setEditingTravel(travel);
    setEditForm({
      location: travel.location,
      date: travel.date,
      expense: travel.expense,
      notes: travel.notes
    });
  };

  const handleEditSave = async () => {
    if (!editingTravel) return;

    await updateDoc(doc(db, "travels", editingTravel.id), {
      location: editForm.location,
      date: editForm.date,
      expense: Number(editForm.expense) || 0,
      notes: editForm.notes
    });

    setEditingTravel(null); // Close modal
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

      {/* Total Expense */}
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

      {/* Travel Entries */}
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

          <div style={{ display: "flex", gap: "4%" }}>
            <button
              onClick={() => openEdit(travel)}
              style={{
                marginTop: "10px",
                padding: "8px",
                width: "48%",
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
        </div>
      ))}

      {/* Edit Modal */}
      {editingTravel && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              padding: "20px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "400px",
              color: "white"
            }}
          >
            <h3>Edit Travel Entry</h3>

            <input
              placeholder="Location"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            <input
              type="date"
              value={editForm.date}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            <input
              placeholder="Expense"
              type="number"
              value={editForm.expense}
              onChange={(e) =>
                setEditForm({ ...editForm, expense: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            <input
              placeholder="Notes"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={handleEditSave}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#4caf50",
                  border: "none",
                  borderRadius: "6px",
                  color: "white"
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingTravel(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#ff4444",
                  border: "none",
                  borderRadius: "6px",
                  color: "white"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
