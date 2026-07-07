import { useEffect, useState } from "react";
import "./Header.css";

const NAV_ITEMS = [
  { href: "#home", label: "Inicio" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Proyectos" },
  { href: "#experience", label: "Experiencia" },
  { href: "#education", label: "Educación" },
  { href: "#certifications", label: "Certificaciones" },
  { href: "#contact", label: "Contacto" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((currentValue) => !currentValue);
  }

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Navegación principal">
        <a href="#home" className="logo" aria-label="Ir al inicio" onClick={closeMenu}>
          <img src="/LogoCJ.png" alt="Logo principal" className="logo-image" />
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="site-primary-navigation"
          aria-label={isMenuOpen ? "Cerrar menú principal" : "Abrir menú principal"}
          onClick={toggleMenu}
        >
          {isMenuOpen ? "Cerrar" : "Menú"}
        </button>

        <div
          id="site-primary-navigation"
          className={`nav-links ${isMenuOpen ? "is-open" : ""}`}
        >
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <a href="/admin" className="nav-admin-link" onClick={closeMenu}>
            Admin
          </a>
        </div>
      </nav>
    </header>
  );
}
