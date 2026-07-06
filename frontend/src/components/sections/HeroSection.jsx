import "./HeroSection.css";

function buildLocation(profile) {
  const city = profile?.city || "";
  const country = profile?.country || "";
  const locationParts = [city, country].filter(Boolean);

  if (locationParts.length > 0) {
    return locationParts.join(", ");
  }

  return profile?.location || "";
}

export default function HeroSection({ profile, socialLinks = [] }) {
  const fullName = profile?.full_name || profile?.name || "";
  const professionalTitle =
    profile?.title || profile?.professional_title || profile?.headline || "";
  const summary =
    profile?.summary ||
    profile?.description ||
    "La información principal del perfil aún no está disponible.";
  const location = buildLocation(profile);

  const avatarSrc =
    profile?.avatar?.data_base64 && profile?.avatar?.mime_type
      ? `data:${profile.avatar.mime_type};base64,${profile.avatar.data_base64}`
      : null;

  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          {avatarSrc && (
            <img src={avatarSrc} alt={fullName || "Perfil"} className="hero-avatar" />
          )}

          <span className="badge">Portfolio Full Stack</span>

          <h1>{fullName ? <>Hola, soy <span>{fullName}</span></> : "Perfil profesional"}</h1>

          {professionalTitle && <h2>{professionalTitle}</h2>}

          <p>{summary}</p>

          <div className="hero-meta">
            {location && <span>📍 {location}</span>}
            <span>🚀 FastAPI + React</span>
          </div>

          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              Ver proyectos
            </a>

            <a href="#contact" className="btn btn-secondary">
              Contactarme
            </a>
          </div>

          {socialLinks.length > 0 && (
            <div className="social-links">
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
          <div className="hero-card-item">
            <span>Backend</span>
            <strong>FastAPI conectado</strong>
            <p>La información visible viene desde la API pública del portafolio.</p>
          </div>

          <div className="hero-card-item">
            <span>Frontend</span>
            <strong>React + Vite</strong>
            <p>Interfaz modular preparada para crecer por secciones reutilizables.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
