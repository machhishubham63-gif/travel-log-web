import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  // Not logged in → show login
  if (!user) {
    return <Login />;
  }

  // Logged in → show dashboard
  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>Travel Log Dashboard</h2>

      <button
        onClick={() => signOut(auth)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
          backgroundColor: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "6px"
        }}
      >
        Logout
      </button>

      <TravelForm user={user} />
      <TravelList user={user} />
    </div>
  );
}
