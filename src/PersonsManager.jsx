import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function PersonsManager({ user }) {
  const [persons, setPersons] = useState([]);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newName || !newAmount || !user) return;
    try {
      await addDoc(collection(db, "persons"), {
        userId: user.uid, name: newName, defaultAmount: Number(newAmount), isStarred: false, createdAt: new Date()
      });
      setNewName(""); setNewAmount("");
    } catch (error) { alert("Error adding person"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this person?")) await deleteDoc(doc(db, "persons", id));
  };

  const toggleStar = async (person) => {
    await updateDoc(doc(db, "persons", person.id), { isStarred: !person.isStarred });
  };

  const inputStyle = { width: "100%", padding: "16px", marginBottom: "12px", boxSizing: "border-box", borderRadius: "16px", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif", color: "var(--text-main)" }}>
      <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>Manage Persons</h2>

      <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "32px", marginBottom: "32px", border: "1px solid var(--border-light)" }}>
        <h3 style={{ marginTop: 0, color: "var(--accent-blue)", fontSize: "16px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Add Colleague</h3>
        <form onSubmit={handleAddPerson} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
          <input type="number" placeholder="₹ Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <button type="submit" style={{ width: "100%", padding: "16px", backgroundColor: "var(--accent-blue)", color: "white", border: "none", borderRadius: "20px", fontWeight: "800", fontSize: "16px", cursor: "pointer", marginTop: "12px", boxShadow: "0 4px 15px rgba(68, 138, 255, 0.3)" }}>Add Person</button>
        </form>
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Saved Persons</h3>
      {persons.length === 0 && <p style={{ color: "var(--text-muted)", paddingLeft: "8px", fontWeight: "600" }}>No persons added yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {persons.map((person) => (
          <div key={person.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-card)", padding: "16px 20px", borderRadius: "24px", border: "1px solid var(--border-light)" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "18px", fontWeight: "800", display: "block", marginBottom: "4px" }}>{person.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "600" }}>Default: ₹{person.defaultAmount}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => toggleStar(person)} style={{ background: person.isStarred ? "var(--accent-yellow)" : "var(--bg-surface)", border: person.isStarred ? "1px solid var(--accent-yellow)" : "1px solid var(--border-strong)", color: person.isStarred ? "#000" : "var(--text-muted)", padding: "12px", borderRadius: "16px", cursor: "pointer", fontSize: "16px", fontWeight: "800", transition: "all 0.2s" }}>
                {person.isStarred ? "⭐ Tracked" : "☆ Track"}
              </button>
              <button onClick={() => handleDelete(person.id)} style={{ background: "var(--accent-red-bg)", border: "1px solid var(--accent-red)", color: "var(--accent-red)", padding: "12px 16px", borderRadius: "16px", cursor: "pointer", fontWeight: "800" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
