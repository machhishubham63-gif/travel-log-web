import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort so the newest dates appear at the top
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTravels(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    // Add a quick confirmation before deleting
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await deleteDoc(doc(db, "travels", id));
    }
  };

  return (
    <div>
      {travels.length === 0 && <p style={{ color: "#888" }}>No trips logged yet.</p>}

      {travels.map((travel) => {
        // SAFEGUARD: Catch your old test data so the app doesn't crash again!
        if (!travel.morning && !travel.evening && !travel.isNotGoing) {
          return (
            <div key={travel.id} style={{ background: "#555", padding: "15px", marginBottom: "12px", borderRadius: "10px", color: "white" }}>
              <p>⚠️ <em>Old Test Data detected. Please delete this entry.</em></p>
              <button onClick={() => handleDelete(travel.id)} style={{ padding: "8px 16px", background: "#ef4444", border: "none", borderRadius: "6px", color: "white" }}>Delete Old Data</button>
            </div>
          );
        }

        return (
          <div
            key={travel.id}
            style={{
              background: "#1e1e1e",
              padding: "15px",
              marginBottom: "12px",
              borderRadius: "10px",
              color: "white",
              borderLeft: travel.isNotGoing ? "5px solid #ef4444" : "5px solid #4caf50"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>{travel.date}</h3>
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

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                onClick={() => handleDelete(travel.id)}
                style={{
                  padding: "6px 16px",
                  background: "transparent",
                  border: "1px solid #ef4444",
                  borderRadius: "6px",
                  color: "#ef4444",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
