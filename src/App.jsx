import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f0fdf4", fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ textAlign: "center", color: "#4b7c5a" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📅</div>
          <div>Cargando...</div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}
