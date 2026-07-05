import "./HeroSection.css";

export default function HeroSection({ profile, socialLinks = [] }) {
  /*
    Este componente recibe datos desde HomePage.jsx.

    profile:
    Debe contener la información principal del perfil profesional.

    socialLinks:
    Debe contener los enlaces sociales del portafolio.
  */

  const fullName =
    profile?.full_name ||
    profile?.name ||
    "Carlos Andrés Jiménez Sarmiento";

  const professionalTitle =
    profile?.title ||
    profile?.professional_title ||
    profile?.headline ||
    "Desarrollador Full Stack";

  const summary =
    profile?.summary ||
    profile?.description ||
    "Ingeniero de Sistemas enfocado en desarrollo backend, frontend y soluciones tecnológicas modernas.";

  const location = profile?.location || "Colombia";

  const avatarSrc = profile?.avatar?.data_base64 && profile?.avatar?.mime_type
    ? `data:${profile.avatar.mime_type};base64,${profile.avatar.data_base64}`
    : null;

  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          {/* Avatar del perfil si existe. */}
          {avatarSrc && (
            <img src={avatarSrc} alt={fullName} className="hero-avatar" />
          )}

          {/* Etiqueta visual corta para identificar el tipo de proyecto. */}
          <span className="badge">Portfolio Full Stack</span>

          {/* Nombre principal tomado del JSON del backend. */}
          <h1>
            Hola, soy <span>{fullName}</span>
          </h1>

          {/* Rol profesional tomado del JSON del backend. */}
          <h2>{professionalTitle}</h2>

          {/* Resumen profesional tomado del JSON del backend. */}
          <p>{summary}</p>

          <div className="hero-meta">
            {/* Ubicación del perfil. */}
            <span>📍 {location}</span>

            {/* Stack principal usado en este proyecto. */}
            <span>🚀 FastAPI + React</span>
          </div>

          <div className="hero-actions">
            {/* Botón que enviará al usuario a la sección de proyectos. */}
            <a href="#projects" className="btn btn-primary">
              Ver proyectos
            </a>

            {/* Botón que enviará al usuario a la sección de contacto. */}
            <a href="#contact" className="btn btn-secondary">
              Contactarme
            </a>
          </div>

          {socialLinks.length > 0 && (
            <div className="social-links">
              {/* Lista de redes sociales tomadas del JSON del backend. */}
              {socialLinks.map((link) => (
                <a
                  key={link.id || link.url || link.name || link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.name || link.platform || "Link"}
                </a>
              ))}
            </div>
          )}
        </div>

        <aside className="hero-card">
          {/* Tarjeta visual para comunicar que el backend está conectado. */}
          <div className="hero-card-item">
            <span>Backend</span>
            <strong>FastAPI conectado</strong>
            <p>
              La información visible viene desde la API pública del portafolio.
            </p>
          </div>

          {/* Tarjeta visual para comunicar el stack frontend. */}
          <div className="hero-card-item">
            <span>Frontend</span>
            <strong>React + Vite</strong>
            <p>
              Interfaz modular preparada para crecer por secciones reutilizables.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}