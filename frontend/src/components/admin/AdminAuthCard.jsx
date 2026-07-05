import "./AdminAuthCard.css";

export default function AdminAuthCard({
  loginForm,
  authenticating,
  errorMessage,
  successMessage,
  onLoginChange,
  onLoginSubmit,
}) {
  return (
    <section className="admin-card auth-card admin-auth-card">
      <span className="badge">Acceso administrativo</span>
      <h1>Ingresar al panel</h1>
      <p>Usa las credenciales del backend para administrar el portafolio.</p>

      <form className="admin-form" onSubmit={onLoginSubmit}>
        <label>
          Usuario
          <input
            name="username"
            type="text"
            value={loginForm.username}
            onChange={onLoginChange}
            placeholder="admin"
            autoComplete="username"
            disabled={authenticating}
          />
        </label>

        <label>
          Contraseña
          <input
            name="password"
            type="password"
            value={loginForm.password}
            onChange={onLoginChange}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={authenticating}
          />
        </label>

        {errorMessage && <p className="admin-message error">{errorMessage}</p>}
        {successMessage && <p className="admin-message success">{successMessage}</p>}

        <button type="submit" className="admin-button primary" disabled={authenticating}>
          {authenticating ? "Validando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}