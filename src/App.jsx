import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Still checking auth
  if (user === undefined) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Login />;
  }

  // Logged in
  return (
    <div style={{ padding: "20px" }}>
      <h2>Travel Log</h2>
      <TravelForm user={user} />
      <TravelList user={user} />
    </div>
  );
}

export default App;
