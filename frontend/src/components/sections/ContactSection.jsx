import { useState } from "react";
import { sendContactMessage } from "../../services/publicApi";
import "./ContactSection.css";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactSection({ profile }) {
  /*
    Este componente controla el formulario de contacto.

    Responsabilidades:
    - Mostrar campos para nombre, correo, asunto y mensaje.
    - Guardar lo que el usuario escribe.
    - Validar datos mínimos antes de enviar.
    - Enviar la información al backend usando sendContactMessage().
    - Mostrar estado de carga, éxito o error.
  */

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const contactEmail = profile?.email || "correo@example.com";
  const contactLocation = profile?.location || "Colombia";
  const cvUrl = profile?.cv_url || "";

  function handleChange(event) {
    /*
      Esta función se ejecuta cada vez que el usuario escribe en un input o textarea.

      event.target.name identifica el campo:
      - name
      - email
      - subject
      - message

      event.target.value contiene lo que el usuario escribió.
    */

    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function validateForm() {
    /*
      Validación básica del formulario.

      No reemplaza las validaciones del backend, pero mejora la experiencia
      porque evita enviar formularios incompletos.
    */

    if (!formData.name.trim()) {
      return "El nombre es obligatorio.";
    }

    if (!formData.email.trim()) {
      return "El correo electrónico es obligatorio.";
    }

    if (!formData.email.includes("@")) {
      return "Ingresa un correo electrónico válido.";
    }

    if (!formData.message.trim()) {
      return "El mensaje es obligatorio.";
    }

    if (formData.message.trim().length < 10) {
      return "El mensaje debe tener al menos 10 caracteres.";
    }

    return "";
  }

  async function handleSubmit(event) {
    /*
      Esta función se ejecuta cuando el usuario envía el formulario.

      Flujo:
      1. Evita que el navegador recargue la página.
      2. Limpia mensajes anteriores.
      3. Valida el formulario.
      4. Envía los datos al backend.
      5. Muestra respuesta de éxito o error.
    */

    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || null,
        message: formData.message.trim(),
      };

      const response = await sendContactMessage(payload);

      setSuccessMessage(
        response?.message || "Mensaje enviado correctamente."
      );

      setFormData(initialFormData);
    } catch (error) {
      console.error("Error enviando mensaje de contacto:", error);

      setErrorMessage(
        "No se pudo enviar el mensaje. Verifica que el backend esté funcionando."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container contact-container">
        <div className="contact-info">
          {/* Etiqueta visual de la sección. */}
          <span className="badge">Contacto</span>

          {/* Título principal de la sección. */}
          <h2>Hablemos de tu próximo proyecto</h2>

          {/* Texto introductorio para invitar al usuario a escribir. */}
          <p>
            Si tienes una idea, una oportunidad laboral o quieres conversar
            sobre desarrollo web, backend, automatización o soluciones digitales,
            puedes escribirme desde este formulario.
          </p>

          <div className="contact-highlights">
            {/* Estos puntos explican qué tipo de contacto se puede hacer. */}
            <article>
              <strong>Disponible para oportunidades</strong>
              <span>Desarrollo backend, frontend y proyectos full stack.</span>
            </article>

            <article>
              <strong>Respuesta organizada</strong>
              <span>El mensaje queda guardado en la base de datos del backend.</span>
            </article>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-highlights">
            <article>
              <strong>Correo directo</strong>
              <span>{contactEmail}</span>
            </article>

            <article>
              <strong>Ubicación</strong>
              <span>{contactLocation}</span>
            </article>

            {cvUrl && (
              <article>
                <strong>Currículum</strong>
                <a href={cvUrl} target="_blank" rel="noreferrer">
                  Ver CV
                </a>
              </article>
            )}
          </div>

          {/* Aquí debe aparecer el campo para el nombre del visitante. */}
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Aquí debe aparecer el campo para el correo electrónico. */}
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu.correo@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Aquí debe aparecer el campo para el asunto del mensaje. */}
          <div className="form-group">
            <label htmlFor="subject">Asunto opcional</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="Ej: Propuesta de proyecto"
              value={formData.subject}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Aquí debe aparecer el campo principal del mensaje. */}
          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              placeholder="Cuéntame en qué puedo ayudarte..."
              rows="6"
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Aquí aparece el mensaje de error si la validación o el backend fallan. */}
          {errorMessage && (
            <p className="form-message form-message-error">{errorMessage}</p>
          )}

          {/* Aquí aparece el mensaje de éxito cuando el backend responde correctamente. */}
          {successMessage && (
            <p className="form-message form-message-success">{successMessage}</p>
          )}

          <button type="submit" className="contact-submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </div>
    </section>
  );
}