import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);
  const [persons, setPersons] = useState([]);
  const [lockedMonths, setLockedMonths] = useState({});
  const [editingTravel, setEditingTravel] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", isNotGoing: false, morningMethod: "", morningAmount: 0, morningNote: "", eveningMethod: "", eveningAmount: 0, eveningNote: "" });
  
  // NEW FEATURE: Search state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "travels"), where("userId", "==", user.uid)), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTravels(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, "persons"), where("userId", "==", user.uid)), (snapshot) => setPersons(snapshot.docs.map(d => d.data())));
    const unsubMonths = onSnapshot(query(collection(db, "months"), where("userId", "==", user.uid), where("isFinalized", "==", true)), (snapshot) => {
      const locks = {}; snapshot.docs.forEach(d => locks[d.data().monthKey] = true); setLockedMonths(locks);
    });
    return () => { unsubscribe(); unsubMonths(); };
  }, [user]);

  const handleDelete = async (id) => { if (window.confirm("Delete this entry?")) await deleteDoc(doc(db, "travels", id)); };

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
    await updateDoc(doc(db, "travels", editingTravel.id), {
      date: editForm.date, monthKey: editForm.date.substring(0, 7), isNotGoing: editForm.isNotGoing,
      morning: editForm.isNotGoing ? null : { method: editForm.morningMethod, amount: Number(editForm.morningAmount) || 0, note: editForm.morningNote },
      evening: editForm.isNotGoing ? null : { method: editForm.eveningMethod, amount: Number(editForm.eveningAmount) || 0, note: editForm.eveningNote },
      totalAmount: editForm.isNotGoing ? 0 : (Number(editForm.morningAmount) || 0) + (Number(editForm.eveningAmount) || 0),
    });
    setEditingTravel(null);
  };

  const availableMethods = ["Own Vehicle", "Train", "Bus", ...persons.map(p => p.name)];
  const inputStyle = { width: "100%", padding: "14px", marginBottom: "10px", boxSizing: "border-box", borderRadius: "16px", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", fontSize: "15px", fontWeight: "600" };

  // Apply search filter
  const filteredTravels = travels.filter(t => 
    t.date.includes(searchTerm) || 
    t.morning?.method.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.evening?.method.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.morning?.note?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.evening?.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      
      {/* NEW FEATURE: Search Box */}
      <input 
        type="text" 
        placeholder="🔍 Search dates, methods, or notes..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        style={{ width: "100%", padding: "16px 20px", borderRadius: "24px", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-surface)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600", marginBottom: "24px", boxSizing: "border-box" }} 
      />

      {filteredTravels.length === 0 && <p style={{ color: "var(--text-faded)", fontWeight: "600", paddingLeft: "8px" }}>No trips found.</p>}

      {filteredTravels.map((travel) => {
        if (!travel.morning && !travel.evening && !travel.isNotGoing) return null;
        const isLocked = lockedMonths[travel.monthKey];

        return (
          <div key={travel.id} style={{ background: "var(--bg-card)", padding: "20px", marginBottom: "16px", borderRadius: "24px", color: "var(--text-main)", border: "1px solid var(--border-light)", borderLeft: travel.isNotGoing ? "6px solid var(--accent-red)" : "6px solid var(--accent-blue)", opacity: isLocked ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{travel.date.split("-").reverse().join("/")}</h3>
              <h3 style={{ margin: 0, color: travel.isNotGoing ? "var(--accent-red)" : "var(--text-main)", fontSize: "20px", fontWeight: "800" }}>₹{travel.totalAmount}</h3>
            </div>

            {travel.isNotGoing ? (
              <p style={{ color: "var(--accent-red)", margin: "8px 0", fontWeight: "700", backgroundColor: "var(--accent-red-bg)", padding: "12px", borderRadius: "12px", textAlign: "center" }}>❌ Marked as Not Going</p>
            ) : (
              <div style={{ background: "var(--bg-input)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-strong)" }}>
                <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600" }}>
                  <strong style={{ color: "var(--accent-blue)", textTransform: "uppercase", fontSize: "12px", marginRight: "8px", fontWeight: "800" }}>AM</strong> {travel.morning?.method} <span style={{float: "right", fontWeight: "800", color: "var(--text-main)"}}>₹{travel.morning?.amount}</span>
                  {travel.morning?.note && <span style={{ display: "block", color: "var(--text-muted)", fontSize: "13px", marginTop: "6px", fontStyle: "italic" }}>"{travel.morning.note}"</span>}
                </p>
                <div style={{ height: "1px", background: "var(--border-strong)", margin: "12px 0" }}></div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                  <strong style={{ color: "var(--accent-purple)", textTransform: "uppercase", fontSize: "12px", marginRight: "8px", fontWeight: "800" }}>PM</strong> {travel.evening?.method} <span style={{float: "right", fontWeight: "800", color: "var(--text-main)"}}>₹{travel.evening?.amount}</span>
                  {travel.evening?.note && <span style={{ display: "block", color: "var(--text-muted)", fontSize: "13px", marginTop: "6px", fontStyle: "italic" }}>"{travel.evening.note}"</span>}
                </p>
              </div>
            )}

            {isLocked ? (
              <div style={{ textAlign: "right", marginTop: "16px", color: "var(--accent-green)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>🔒 Finalized</div>
            ) : (
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => openEdit(travel)} style={{ flex: 1, padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "16px", color: "var(--text-main)", fontWeight: "800", cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(travel.id)} style={{ padding: "12px 20px", background: "var(--accent-red-bg)", border: "1px solid var(--accent-red)", borderRadius: "16px", color: "var(--accent-red)", fontWeight: "800", cursor: "pointer" }}>Delete</button>
              </div>
            )}
          </div>
        );
      })}

      {/* EDIT MODAL REMAINS THE SAME BUT USES CSS VARIABLES */}
      {editingTravel && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "32px", width: "100%", maxWidth: "400px", color: "var(--text-main)", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-light)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <h3 style={{ marginTop: 0, fontSize: "22px", fontWeight: "800" }}>Edit Entry</h3>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", backgroundColor: editForm.isNotGoing ? "var(--accent-red-bg)" : "var(--bg-input)", color: editForm.isNotGoing ? "var(--accent-red)" : "var(--text-main)", padding: "0 16px", borderRadius: "16px", fontWeight: "800", border: editForm.isNotGoing ? "1px solid var(--accent-red)" : "1px solid var(--border-strong)" }}>
                <input type="checkbox" checked={editForm.isNotGoing} onChange={(e) => setEditForm({ ...editForm, isNotGoing: e.target.checked })} style={{ marginRight: "10px", accentColor: "var(--accent-red)", width: "18px", height: "18px" }} />
                Not Going
              </label>
            </div>

            {!editForm.isNotGoing && (
              <>
                <div style={{ backgroundColor: "var(--bg-input)", padding: "16px", borderRadius: "24px", marginBottom: "16px", border: "1px solid var(--border-strong)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-blue)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>☀️ Morning</h4>
                  <select value={editForm.morningMethod} onChange={(e) => handleEditMethodChange("morning", e.target.value)} style={{...inputStyle, backgroundColor: "var(--bg-surface)"}}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.morningAmount} onChange={(e) => setEditForm({ ...editForm, morningAmount: e.target.value })} style={{ ...inputStyle, flex: 1, backgroundColor: "var(--bg-surface)", marginBottom: 0 }} />
                    <input type="text" placeholder="Note" value={editForm.morningNote} onChange={(e) => setEditForm({ ...editForm, morningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5, backgroundColor: "var(--bg-surface)", marginBottom: 0 }} />
                  </div>
                </div>

                <div style={{ backgroundColor: "var(--bg-input)", padding: "16px", borderRadius: "24px", marginBottom: "16px", border: "1px solid var(--border-strong)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--accent-purple)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>🌙 Evening</h4>
                  <select value={editForm.eveningMethod} onChange={(e) => handleEditMethodChange("evening", e.target.value)} style={{...inputStyle, backgroundColor: "var(--bg-surface)"}}>
                    {availableMethods.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" value={editForm.eveningAmount} onChange={(e) => setEditForm({ ...editForm, eveningAmount: e.target.value })} style={{ ...inputStyle, flex: 1, backgroundColor: "var(--bg-surface)", marginBottom: 0 }} />
                    <input type="text" placeholder="Note" value={editForm.eveningNote} onChange={(e) => setEditForm({ ...editForm, eveningNote: e.target.value })} style={{ ...inputStyle, flex: 1.5, backgroundColor: "var(--bg-surface)", marginBottom: 0 }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setEditingTravel(null)} style={{ flex: 1, padding: "16px", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "24px", color: "var(--text-main)", fontWeight: "800", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleEditSave} style={{ flex: 2, padding: "16px", background: "var(--accent-green)", color: "#000", border: "none", borderRadius: "24px", fontWeight: "800", cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
