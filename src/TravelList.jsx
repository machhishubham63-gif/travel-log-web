import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [lockedMonths, setLockedMonths] = useState({}); // NEW: Track locked months
  
  const [editingTravel, setEditingTravel] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "", isNotGoing: false,
    morningMethod: "", morningAmount: 0, morningNote: "",
    eveningMethod: "", eveningAmount: 0, eveningNote: ""
  });

  // Fetch Travels
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTravels(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Persons
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // NEW: Fetch Locked Months
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "months"), where("userId", "==", user.uid), where("isFinalized", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locks = {};
      snapshot.docs.forEach(d => {
        locks[d.data().monthKey] = true;
      });
      setLockedMonths(locks);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await deleteDoc(doc(db, "travels", id));
    }
  };

  const formatIndianDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const openEdit = (travel) => {
    setEditingTravel(travel);
    setEditForm({
      date: travel.date,
      isNotGoing: travel.isNotGoing || false,
      morningMethod: travel.morning?.method || "Own Vehicle",
      morningAmount: travel.morning?.amount || 0,
      morningNote: travel.morning?.note || "",
      eveningMethod: travel.evening?.method || "Own Vehicle",
      eveningAmount: travel.evening?.amount || 0,
      eveningNote: travel.evening?.note || ""
    });
  };

  const handleEditMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;

    if (timeOfDay === "morning") {
      setEditForm({ ...editForm, morningMethod: selectedMethod, morningAmount: amountToSet });
    } else {
      setEditForm({ ...editForm, eveningMethod: selectedMethod, eveningAmount: amountToSet });
    }
  };

  const handleEditSave = async () => {
    if (!editingTravel) return;
    const monthKey = editForm.date.substring(0, 7);
    
    await updateDoc(doc(db, "travels", editingTravel.id), {
      date: editForm.date,
      monthKey: monthKey,
      isNotGoing: editForm.isNotGoing,
      morning: editForm.isNotGoing ? null : {
        method: editForm.morningMethod,
        amount: Number(editForm.morningAmount) || 0,
        note: editForm.morningNote
      },
      evening: editForm.isNotGoing ? null : {
        method: editForm.eveningMethod,
        amount: Number(editForm.eveningAmount) || 0,
        note: editForm.eveningNote
      },
      totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
    });

    setEditingTravel(null);
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];

  return (
    <div>
      {travels.length === 0 && <p style={{ color: "#888" }}>No trips logged yet.</p>}

      {travels.map((travel) => {
        if (!travel.morning && !travel.evening && !travel.isNotGoing) {
          return null; // Silently skip old test data if any remains
        }

        const isLocked = lockedMonths[travel.monthKey]; // Check if this trip's month is locked

        return (
          <div
            key={travel.id}
            style={{
              background: "#1e1e1e",
              padding: "15px",
              marginBottom: "12px",
              borderRadius: "10px",
              color: "white",
              borderLeft: travel.isNotGoing ? "5px solid #ef4444" : "5px solid #4caf50",
              opacity: isLocked ? 0.8 : 1 // Slightly dim locked entries
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>{formatIndianDate(travel.date)}</h3>
              <h3 style={{ margin: 0, color: travel.isNotGoing ? "#ef4444" : "#4caf50" }}>
                ₹{travel.totalAmount}
              </h3>
            </div>

            {travel.isNotGoing ? (
              <p style={{ color: "#ef4444", margin: "5px 0" }}>❌ Marked as Not Going</p>
            ) : (
              <div style={{ background: "#2d2d2d", padding: "10px", borderRadius: "6px" }}>
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong style={{ color: "#60a5fa" }}>☀️ Morning:</strong> {travel.morning?.method} (₹{travel.morning?.amount})
                  {travel.morning?.note && <span style={{ color: "#aaa", fontSize: "14px" }}> - Note: {travel.morning.note}</span>}
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: "#f472b6" }}>🌙 Evening:</strong> {travel.evening?.method} (₹{travel.evening?.amount})
                  {travel.evening?.note && <span style={{ color: "#aaa", fontSize: "14px" }}> - Note: {travel.evening.note}</span>}
                </p>
              </div>
            )}

            {/* NEW: Hide edit/delete buttons if month is locked */}
            {isLocked ? (
              <div style={{ textAlign: "right", marginTop: "12px", color: "#34d399", fontSize: "14px", fontWeight: "bold" }}>
                🔒 Finalized Entry
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  onClick={() => openEdit(travel)}
                  style={{ flex: 1, padding: "8px", background: "#3b82f6", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(travel.id)}
                  style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid #ef4444", borderRadius: "6px", color: "#ef4444", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* --- EDIT MODAL (Unchanged) --- */}
      {editingTravel && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "#1e1e1e", padding: "20px", borderRadius: "10px", width: "100%", maxWidth: "400px", color: "white", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Edit Travel Entry</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={{ flex: 1, padding: "8px", boxSizing: "border-box" }} />
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: editForm.isNotGoing ? "#ef4444" : "#333", padding: "8px 12px", borderRadius: "4px" }}>
                <input type="checkbox" checked={editForm.isNotGoing} onChange={(e) => setEditForm({ ...editForm, isNotGoing: e.target.checked })} style={{ marginRight: "8px" }} />
                Not Going
              </label>
            </div>
            {!editForm.isNotGoing && (
              <>
                <div style={{ backgroundColor: "#2d2d2d", padding: "10px", borderRadius: "6px", marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa" }}>☀️ Morning</h4>
                  <select value={editForm.morningMethod} onChange={(e) => handleEditMethodChange("morning", e.target.value)} style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.morningAmount} onChange={(e) => setEditForm({ ...editForm, morningAmount: e.target.value })} style={{ flex: 1, padding: "8px", boxSizing: "border-box" }} />
                    <input type="text" placeholder="Note" value={editForm.morningNote} onChange={(e) => setEditForm({ ...editForm, morningNote: e.target.value })} style={{ flex: 2, padding: "8px", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ backgroundColor: "#2d2d2d", padding: "10px", borderRadius: "6px", marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#f472b6" }}>🌙 Evening</h4>
                  <select value={editForm.eveningMethod} onChange={(e) => handleEditMethodChange("evening", e.target.value)} style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.eveningAmount} onChange={(e) => setEditForm({ ...editForm, eveningAmount: e.target.value })} style={{ flex: 1, padding: "8px", boxSizing: "border-box" }} />
                    <input type="text" placeholder="Note" value={editForm.eveningNote} onChange={(e) => setEditForm({ ...editForm, eveningNote: e.target.value })} style={{ flex: 2, padding: "8px", boxSizing: "border-box" }} />
                  </div>
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleEditSave} style={{ flex: 1, padding: "10px", background: "#4caf50", border: "none", borderRadius: "6px", color: "white" }}>Save Changes</button>
              <button onClick={() => setEditingTravel(null)} style={{ flex: 1, padding: "10px", background: "#555", border: "none", borderRadius: "6px", color: "white" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
