import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <nav className="navbar container">
        {/* 
          Marca principal del portafolio.
          Debe aparecer en la parte izquierda del Header.
        */}
        <a href="#home" className="logo" aria-label="Ir al inicio">
          <img src="/LogoCJ.png" alt="Logo principal" className="logo-image" />
        </a>

        {/* 
          Navegación interna.
          Cada enlace apunta a una sección del portafolio.
        */}
        <div className="nav-links" aria-label="Navegación principal">
          <a href="#home">Inicio</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Proyectos</a>
          <a href="#experience">Experiencia</a>
          <a href="#education">Educación</a>
          <a href="#certifications">Certificaciones</a>
          <a href="#contact">Contacto</a>
          <a href="/admin" className="nav-admin-link">Admin</a>
        </div>
      </nav>
    </header>
  );
}
