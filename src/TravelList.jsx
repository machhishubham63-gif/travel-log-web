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
const handleDelete = async (id) => {
  await deleteDoc(doc(db, "travels", id));
};
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "travels"),
          where("userId", "==", user.uid)
        );

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTravels(data);
        });
      }
    });

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
  color: "white",
  position: "relative",
  zIndex: 1
}}
      >
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
  borderRadius: "6px",
  cursor: "pointer",
  position: "relative",
  zIndex: 2
}}
        >
          Delete
        </button>
      </div>
    ))}
  </div>
);
        >
          <h3>{travel.location}</h3>
          <p>📅 {travel.date}</p>
          <p>💰 ₹{travel.expense}</p>
          <p>{travel.notes}</p>
          <button
  onClick={() => handleDelete(travel.id)}
  style={{
    marginTop: "10px",
    padding: "6px 10px",
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "5px"
  }}
>
  Delete
</button>
        </div>
      ))}
    </div>
  );
}
