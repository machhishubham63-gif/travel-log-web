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

  const inputStyle = { width: "100%", padding: "16px", marginBottom: "12px", boxSizing: "border-box", borderRadius: "16px", border: "none", backgroundColor: "#0A0A0A", color: "white", fontSize: "16px" };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif", color: "white" }}>
      <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>Manage Persons</h2>

      <div style={{ backgroundColor: "#111111", padding: "24px", borderRadius: "32px", marginBottom: "32px", border: "1px solid #222" }}>
        <h3 style={{ marginTop: 0, color: "#448aff", fontSize: "16px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Add Colleague</h3>
        <form onSubmit={handleAddPerson} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Name (e.g., Prashant)" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
          <input type="number" placeholder="₹ Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <button type="submit" style={{ width: "100%", padding: "16px", backgroundColor: "#448aff", color: "white", border: "none", borderRadius: "20px", fontWeight: "800", fontSize: "16px", cursor: "pointer", marginTop: "12px", boxShadow: "0 4px 15px rgba(68, 138, 255, 0.3)" }}>
            Add Person
          </button>
        </form>
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Saved Persons</h3>
      {persons.length === 0 && <p style={{ color: "#666", paddingLeft: "8px", fontWeight: "600" }}>No persons added yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {persons.map((person) => (
          <div key={person.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111111", padding: "16px 20px", borderRadius: "24px", border: "1px solid #222" }}>
            
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "18px", fontWeight: "700", display: "block", marginBottom: "4px" }}>{person.name}</span>
              <span style={{ color: "#888", fontSize: "14px", fontWeight: "600" }}>Default: ₹{person.defaultAmount}</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => toggleStar(person)} 
                title="Star to track settlements"
                style={{ background: person.isStarred ? "#ffd74020" : "#1A1A1A", border: person.isStarred ? "1px solid #ffd74050" : "1px solid #333", color: person.isStarred ? "#ffd740" : "#666", padding: "12px", borderRadius: "16px", cursor: "pointer", fontSize: "16px", transition: "all 0.2s" }}
              >
                {person.isStarred ? "⭐ Tracked" : "☆ Track"}
              </button>
              <button 
                onClick={() => handleDelete(person.id)} 
                style={{ background: "#ff525215", border: "1px solid #ff525230", color: "#ff5252", padding: "12px 16px", borderRadius: "16px", cursor: "pointer", fontWeight: "700" }}
              >
                Delete
              </button>
            </div>

          </div>
        ))}
      </div>
      <p style={{ color: "#666", fontSize: "13px", marginTop: "24px", textAlign: "center", padding: "0 20px" }}>
        Tip: Star a person (⭐) to automatically track their monthly settlements in the Pay tab.
      </p>
    </div>
  );
}
