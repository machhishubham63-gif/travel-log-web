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
  const [editingTravel, setEditingTravel] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    officeType: "person",
    officePerson: "Person A",
    officeAmount: 0,
    returnType: "person",
    returnPerson: "Person A",
    returnAmount: 0,
    notes: ""
  });

  // Fetch travels
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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
      date: travel.date,
      officeType: travel.officeTrip.type,
      officePerson: travel.officeTrip.name || "Person A",
      officeAmount: travel.officeTrip.amount || 0,
      returnType: travel.returnTrip.type,
      returnPerson: travel.returnTrip.name || "Person A",
      returnAmount: travel.returnTrip.amount || 0,
      notes: travel.notes || ""
    });
  };

  const handleEditSave = async () => {
    if (!editingTravel) return;

    const totalAmount = (editForm.officeAmount || 0) + (editForm.returnAmount || 0);

    await updateDoc(doc(db, "travels", editingTravel.id), {
      date: editForm.date,
      officeTrip: {
        type: editForm.officeType,
        name: editForm.officeType === "person" ? editForm.officePerson : undefined,
        amount: Number(editForm.officeAmount) || 0
      },
      returnTrip: {
        type: editForm.returnType,
        name: editForm.returnType === "person" ? editForm.returnPerson : undefined,
        amount: Number(editForm.returnAmount) || 0
      },
      totalAmount,
      notes: editForm.notes
    });

    setEditingTravel(null);
  };

  return (
    <div>
      {travels.map((travel) => (
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
          <h3>{travel.date}</h3>
          <p>
            Office → {travel.officeTrip.name || "Bus/Train"} ({travel.officeTrip.type}) - ₹{travel.officeTrip.amount}
          </p>
          <p>
            Return → {travel.returnTrip.name || "Bus/Train"} ({travel.returnTrip.type}) - ₹{travel.returnTrip.amount}
          </p>
          <p>Total: ₹{travel.totalAmount}</p>
          <p>Notes: {travel.notes}</p>

          <div style={{ display: "flex", gap: "4%" }}>
            <button
              onClick={() => openEdit(travel)}
              style={{
                flex: 1,
                padding: "8px",
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
                flex: 1,
                padding: "8px",
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

            {/* Date */}
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            {/* Office Trip */}
            <label>Office Trip:</label>
            <select
              value={editForm.officeType}
              onChange={(e) => setEditForm({ ...editForm, officeType: e.target.value })}
              style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
            >
              <option value="person">Person</option>
              <option value="bus/train">Bus/Train</option>
            </select>

            {editForm.officeType === "person" && (
              <select
                value={editForm.officePerson}
                onChange={(e) => setEditForm({ ...editForm, officePerson: e.target.value })}
                style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
              >
                <option value="Person A">Person A</option>
                <option value="Person B">Person B</option>
              </select>
            )}

            <input
              type="number"
              placeholder="Amount"
              value={editForm.officeAmount}
              onChange={(e) => setEditForm({ ...editForm, officeAmount: Number(e.target.value) })}
              style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
            />

            {/* Return Trip */}
            <label>Return Trip:</label>
            <select
              value={editForm.returnType}
              onChange={(e) => setEditForm({ ...editForm, returnType: e.target.value })}
              style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
            >
              <option value="person">Person</option>
              <option value="bus/train">Bus/Train</option>
            </select>

            {editForm.returnType === "person" && (
              <select
                value={editForm.returnPerson}
                onChange={(e) => setEditForm({ ...editForm, returnPerson: e.target.value })}
                style={{ width: "100%", padding: "6px", marginBottom: "4px" }}
              >
                <option value="Person A">Person A</option>
                <option value="Person B">Person B</option>
              </select>
            )}

            <input
              type="number"
              placeholder="Amount"
              value={editForm.returnAmount}
              onChange={(e) => setEditForm({ ...editForm, returnAmount: Number(e.target.value) })}
              style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
            />

            {/* Notes */}
            <input
              placeholder="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
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
