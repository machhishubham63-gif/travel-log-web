import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [lockedMonths, setLockedMonths] = useState({});
  const [editingTravel, setEditingTravel] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", isNotGoing: false, morningMethod: "", morningAmount: 0, morningNote: "", eveningMethod: "", eveningAmount: 0, eveningNote: "" });

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

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "persons"), where("userId", "==", user.uid)), (snapshot) => setPersons(snapshot.docs.map(d => d.data())));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "months"), where("userId", "==", user.uid), where("isFinalized", "==", true)), (snapshot) => {
      const locks = {}; snapshot.docs.forEach(d => locks[d.data().monthKey] = true); setLockedMonths(locks);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this entry?")) await deleteDoc(doc(db, "travels", id));
  };

  const openEdit = (travel) => {
    setEditingTravel(travel);
    setEditForm({
      date: travel.date, isNotGoing: travel.isNotGoing || false,
      morningMethod: travel.morning?.method || "Own Vehicle", morningAmount: travel.morning?.amount || 0, morningNote: travel.morning?.note || "",
      eveningMethod: travel.evening?.method || "Own Vehicle", eveningAmount: travel.evening?.amount || 0, eveningNote: travel.evening?.note || ""
    });
  };

  const handleEditMethodChange = (timeOfDay, selectedMethod) => {
    let amountToSet = 0;
    const foundPerson = persons.find(p => p.name === selectedMethod);
    if (foundPerson) amountToSet = foundPerson.defaultAmount;
    if (timeOfDay === "morning") setEditForm({ ...editForm, morningMethod: selectedMethod, morningAmount: amountToSet });
    else setEditForm({ ...editForm, eveningMethod: selectedMethod, eveningAmount: amountToSet });
  };

  const handleEditSave = async () => {
    if (!editingTravel) return;
    const monthKey = editForm.date.substring(0, 7);
    await updateDoc(doc(db, "travels", editingTravel.id), {
      date: editForm.date, monthKey: monthKey, isNotGoing: editForm.isNotGoing,
      morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote },
      evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote },
      totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
    });
    setEditingTravel(null);
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];
  const inputStyle = { width: "100%", padding: "14px", marginBottom: "10px", boxSizing: "border-box", borderRadius: "16px", border: "none", backgroundColor: "#0A0A0A", color: "white", fontSize: "15px" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      {travels.length === 0 && <p style={{ color: "#666", fontWeight: "600", paddingLeft: "8px" }}>No trips logged yet.</p>}

      {travels.map((travel) => {
        if (!travel.morning && !travel.evening && !travel.isNotGoing) return null;
        const isLocked = lockedMonths[travel.monthKey];

        return (
          <div key={travel.id} style={{ background: "#111111", padding: "20px", marginBottom: "16px", borderRadius: "24px", color: "white", border: "1px solid #222", borderLeft: travel.isNotGoing ? "6px solid #ff5252" : "6px solid #448aff", opacity: isLocked ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{travel.date.split("-").reverse().join("/")}</h3>
              <h3 style={{ margin: 0, color: travel.isNotGoing ? "#ff8a80" : "white", fontSize: "20px", fontWeight: "800" }}>₹{travel.totalAmount}</h3>
            </div>

            {travel.isNotGoing ? (
              <p style={{ color: "#ff8a80", margin: "8px 0", fontWeight: "700" }}>❌ Marked as Not Going</p>
            ) : (
              <div style={{ background: "#0A0A0A", padding: "16px", borderRadius: "16px" }}>
                <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
                  <strong style={{ color: "#448aff", textTransform: "uppercase", fontSize: "12px", marginRight: "8px" }}>AM</strong> {travel.morning?.method} <span style={{float: "right", fontWeight: "700"}}>₹{travel.morning?.amount}</span>
                  {travel.morning?.note && <span style={{ display: "block", color: "#666", fontSize: "13px", marginTop: "4px" }}>"{travel.morning.note}"</span>}
                </p>
                <div style={{ height: "1px", background: "#222", margin: "10px 0" }}></div>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  <strong style={{ color: "#b388ff", textTransform: "uppercase", fontSize: "12px", marginRight: "8px" }}>PM</strong> {travel.evening?.method} <span style={{float: "right", fontWeight: "700"}}>₹{travel.evening?.amount}</span>
                  {travel.evening?.note && <span style={{ display: "block", color: "#666", fontSize: "13px", marginTop: "4px" }}>"{travel.evening.note}"</span>}
                </p>
              </div>
            )}

            {isLocked ? (
              <div style={{ textAlign: "right", marginTop: "16px", color: "#69f0ae", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>🔒 Finalized</div>
            ) : (
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => openEdit(travel)} style={{ flex: 1, padding: "12px", background: "#1A1A1A", border: "1px solid #333", borderRadius: "16px", color: "white", fontWeight: "700", cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(travel.id)} style={{ padding: "12px 20px", background: "#ff525215", border: "1px solid #ff525230", borderRadius: "16px", color: "#ff5252", fontWeight: "700", cursor: "pointer" }}>Delete</button>
              </div>
            )}
          </div>
        );
      })}

      {/* EDIT MODAL */}
      {editingTravel && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "#1A1A1A", padding: "24px", borderRadius: "32px", width: "100%", maxWidth: "400px", color: "white", maxHeight: "90vh", overflowY: "auto", border: "1px solid #333" }}>
            <h3 style={{ marginTop: 0, fontSize: "22px", fontWeight: "800" }}>Edit Entry</h3>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: editForm.isNotGoing ? "#ff525220" : "#0A0A0A", color: editForm.isNotGoing ? "#ff8a80" : "white", padding: "0 16px", borderRadius: "16px", fontWeight: "700" }}>
                <input type="checkbox" checked={editForm.isNotGoing} onChange={(e) => setEditForm({ ...editForm, isNotGoing: e.target.checked })} style={{ marginRight: "10px", accentColor: "#ff5252", width: "18px", height: "18px" }} />
                Not Going
              </label>
            </div>

            {!editForm.isNotGoing && (
              <>
                <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "24px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#448aff", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>☀️ Morning</h4>
                  <select value={editForm.morningMethod} onChange={(e) => handleEditMethodChange("morning", e.target.value)} style={{...inputStyle, backgroundColor: "#1A1A1A"}}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.morningAmount} onChange={(e) => setEditForm({ ...editForm, morningAmount: e.target.value })} style={{ ...inputStyle, flex: 1, backgroundColor: "#1A1A1A", marginBottom: 0 }} />
                    <input type="text" placeholder="Note" value={editForm.morningNote} onChange={(e) => setEditForm({ ...editForm, morningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5, backgroundColor: "#1A1A1A", marginBottom: 0 }} />
                  </div>
                </div>

                <div style={{ backgroundColor: "#0A0A0A", padding: "16px", borderRadius: "24px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#b388ff", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>🌙 Evening</h4>
                  <select value={editForm.eveningMethod} onChange={(e) => handleEditMethodChange("evening", e.target.value)} style={{...inputStyle, backgroundColor: "#1A1A1A"}}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.eveningAmount} onChange={(e) => setEditForm({ ...editForm, eveningAmount: e.target.value })} style={{ ...inputStyle, flex: 1, backgroundColor: "#1A1A1A", marginBottom: 0 }} />
                    <input type="text" placeholder="Note" value={editForm.eveningNote} onChange={(e) => setEditForm({ ...editForm, eveningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5, backgroundColor: "#1A1A1A", marginBottom: 0 }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setEditingTravel(null)} style={{ flex: 1, padding: "16px", background: "#333", border: "none", borderRadius: "24px", color: "white", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleEditSave} style={{ flex: 2, padding: "16px", background: "#69f0ae", color: "#000", border: "none", borderRadius: "24px", fontWeight: "800", cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
