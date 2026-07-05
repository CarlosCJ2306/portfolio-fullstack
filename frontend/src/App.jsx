import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import "./styles/global.css";

function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  return isAdminRoute ? <AdminPage /> : <HomePage />;
}

export default App;