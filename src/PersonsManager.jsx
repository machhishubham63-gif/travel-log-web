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
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>Yearly</h2>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "10px 16px", borderRadius: "20px", border: "1px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-main)", fontSize: "16px", fontWeight: "600" }}>
          {[...Array(5)].map((_, i) => { const year = (new Date().getFullYear() - 2 + i).toString(); return <option key={year} value={year}>{year}</option>; })}
        </select>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid var(--border-light)" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>Yearly Total</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "var(--accent-yellow)", fontWeight: "800" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "32px", textAlign: "center", border: "1px solid var(--border-light)" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: "800", textTransform: "uppercase" }}>Total Days</p>
          <h3 style={{ margin: 0, fontSize: "28px", color: "var(--accent-blue)", fontWeight: "800" }}>{totalDays}</h3>
        </div>
      </div>

      <h3 style={{ color: "var(--text-main)", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Person Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {Object.entries(personBreakdown).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
          <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-card)", padding: "18px 20px", borderRadius: "24px", color: "var(--text-main)", border: "1px solid var(--border-light)" }}>
            <span style={{fontWeight: "700"}}>{method}</span><strong style={{ color: "var(--accent-purple)", fontSize: "16px" }}>₹{amount}</strong>
          </div>
        ))}
      </div>

      <h3 style={{ color: "var(--text-main)", fontSize: "18px", fontWeight: "800", marginBottom: "16px", paddingLeft: "8px" }}>Monthly Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
        {Object.entries(monthlyBreakdown).map(([key, data]) => (
          <div key={key} onClick={() => navigateTo("dashboard", key)} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--bg-surface)", padding: "18px 20px", borderRadius: "24px", color: "var(--text-main)", border: "1px solid var(--border-strong)", borderLeft: data.amount > 0 ? "6px solid var(--accent-green)" : "1px solid var(--border-strong)", cursor: "pointer", transition: "all 0.2s" }}>
            <span style={{fontWeight: "700"}}>{data.name} <span style={{fontSize: "13px", color: "var(--text-muted)", marginLeft: "8px", fontWeight: "800"}}>→ View</span></span>
            <strong style={{ color: data.amount > 0 ? "var(--text-main)" : "var(--text-faded)", fontSize: "16px" }}>₹{data.amount}</strong>
          </div>
        ))}
      </div>

      <button onClick={handleExport} style={{ width: "100%", padding: "18px", backgroundColor: "var(--accent-green)", color: "#000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(105, 240, 174, 0.3)" }}>
        <span>📊</span> Download Excel Data
      </button>
    </div>
  );
