import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        {/* 
          Aquí debe aparecer el cierre visual del portafolio.
          El año se calcula automáticamente con JavaScript.
        */}
        <p>
          © {currentYear} Carlos Andrés Jiménez Sarmiento. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}