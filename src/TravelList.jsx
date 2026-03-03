import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function TravelList() {
  const [travels, setTravels] = useState([]);

  const fetchTravels = async () => {
    const q = query(
      collection(db, "travels"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setTravels(data);
  };

  useEffect(() => {
    fetchTravels();
  }, []);

  return (
    <div>
      {travels.map(travel => (
        <div key={travel.id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
          <h3>{travel.location}</h3>
          <p>Date: {travel.date}</p>
          <p>Expense: ₹{travel.expense}</p>
          <p>{travel.notes}</p>
        </div>
      ))}
    </div>
  );
}
