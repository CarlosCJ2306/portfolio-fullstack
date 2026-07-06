import "./Footer.css";

export default function Footer({ profile }) {
  const currentYear = new Date().getFullYear();
  const ownerName = profile?.full_name || profile?.name || "";
  const footerLabel = ownerName || "Portfolio CJ";

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <p>
          © {currentYear} {footerLabel}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
