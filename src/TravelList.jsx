import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function TravelList({ user }) {
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "travels"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTravels(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "travels", id));
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
          <h3>{travel.location}</h3>
          <p>{travel.date}</p>
          <p>₹{travel.expense}</p>
          <p>{travel.notes}</p>

          <button
            onClick={() => handleDelete(travel.id)}
            style={{
              marginTop: "10px",
              padding: "8px",
              width: "100%",
              background: "#ff4444",
              border: "none",
              borderRadius: "6px",
              color: "white"
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
