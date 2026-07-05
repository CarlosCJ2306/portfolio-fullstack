import "./AdminTopbar.css";

export default function AdminTopbar({ onLogout }) {
  return (
    <section className="admin-topbar admin-topbar-panel">
      <div>
        <span className="badge">Admin</span>
        <h1>Panel de administración</h1>
        <p>Controla el contenido del portafolio desde una sola interfaz.</p>
      </div>

      <div className="admin-actions">
        <a href="/" className="admin-button secondary">Ver sitio</a>
        <button type="button" className="admin-button ghost" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}