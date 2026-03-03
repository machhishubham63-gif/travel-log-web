import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Travel Log Dashboard</h2>

      <TravelForm
        user={user}
        onAdd={() => setRefreshKey((prev) => prev + 1)}
      />

      <TravelList user={user} key={refreshKey} />
    </div>
  );
}

export default App;
