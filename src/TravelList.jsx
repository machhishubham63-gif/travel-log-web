import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";

export default function TravelList() {
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    const fetchTravels = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "travels"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTravels(data);
    };

    fetchTravels();
  }, []);

  return (
    <div>
      {travels.map(travel => (
        <div
          key={travel.id}
          style={{
            background: "#1e1e1e",
            padding: "15px",
            marginBottom: "12px",
            borderRadius: "10px"
          }}
        >
          <h3>{travel.location}</h3>
          <p>📅 {travel.date}</p>
          <p>💰 ₹{travel.expense}</p>
          <p>{travel.notes}</p>
        </div>
      ))}
    </div>
  );
}
