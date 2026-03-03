import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TravelList() {
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "travels"),
          where("userId", "==", user.uid)
        );

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }));
          setTravels(data);
        });
      }
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "travels", id));
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  };
const totalExpense = travels.reduce(
  (sum, item) => sum + (item.expense || 0),
  0
);
  return (
  <div>
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

    {travels.map((travel) => (
          <h3>{travel.location}</h3>
          <p>📅 {travel.date}</p>
          <p>💰 ₹{travel.expense}</p>
          <p>{travel.notes}</p>

          <button
            onClick={() => handleDelete(travel.id)}
            style={{
              marginTop: "12px",
              padding: "8px",
              width: "100%",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "6px"
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
