import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for login/logout events
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Travel Log</h1>
      
      {user ? (
        <>
          <p>Logged in as: {user.email}</p>
          {/* Pass the reactive user state to your components */}
          <TravelForm user={user} />
          <hr style={{ margin: "20px 0" }} />
          <TravelList user={user} />
        </>
      ) : (
        <p>Please log in to manage your travel logs. (Add your login form here!)</p>
      )}
    </div>
  );
}
