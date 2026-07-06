import { useEffect, useRef, useState } from "react";
import { sendContactMessage } from "../../services/publicApi";
import "./ContactSection.css";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function getContactErrorMessage(error) {
  if (error?.status === 422) {
    return (
      error.userMessage ||
      "Revisa los datos del formulario e intenta nuevamente."
    );
  }

  if (error?.isNetworkError) {
    return (
      error.userMessage ||
      "No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente."
    );
  }

  if (typeof error?.status === "number" && error.status >= 500) {
    return "El mensaje no pudo enviarse en este momento. Intenta nuevamente más tarde.";
  }

  return (
    error?.userMessage ||
    error?.message ||
    "No se pudo enviar el mensaje. Intenta nuevamente."
  );
}

export default function ContactSection({ profile }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const submitControllerRef = useRef(null);
  const contactEmail = profile?.email || "";
  const contactLocation =
    [profile?.city, profile?.country].filter(Boolean).join(", ") ||
    profile?.location ||
    "";
  const cvUrl = profile?.cv_url || "";
  const hasContactInfo = Boolean(contactEmail || contactLocation || cvUrl);

  useEffect(() => {
    return () => {
      submitControllerRef.current?.abort();
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "El nombre es obligatorio.";
    }

    if (!formData.email.trim()) {
      return "El correo electronico es obligatorio.";
    }

    if (!formData.email.includes("@")) {
      return "Ingresa un correo electronico valido.";
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
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || null,
        message: formData.message.trim(),
      };

      const response = await sendContactMessage(payload, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setSuccessMessage(
        response?.message || "Mensaje enviado correctamente."
      );
      setFormData(initialFormData);
    } catch (error) {
      if (error?.isAbortError || error?.name === "AbortError") {
        return;
      }

      console.error("Error enviando mensaje de contacto:", error);
      setErrorMessage(getContactErrorMessage(error));
    } finally {
      if (submitControllerRef.current === controller) {
        submitControllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container contact-container">
        <div className="contact-info">
          <span className="badge">Contacto</span>

          <h2>Hablemos de tu próximo proyecto</h2>

          <p>
            Si tienes una idea, una oportunidad laboral o quieres conversar
            sobre desarrollo web, backend, automatización o soluciones digitales,
            puedes escribirme desde este formulario.
          </p>

          <div className="contact-highlights">
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
            {contactEmail && (
              <article>
                <strong>Correo directo</strong>
                <span className="text-break-safe">{contactEmail}</span>
              </article>
            )}

            {contactLocation && (
              <article>
                <strong>Ubicación</strong>
                <span className="text-break-safe">{contactLocation}</span>
              </article>
            )}

            {cvUrl && (
              <article>
                <strong>Currículum</strong>
                <a href={cvUrl} target="_blank" rel="noreferrer">
                  Ver CV
                </a>
              </article>
            )}

            {!hasContactInfo && (
              <article>
                <strong>Contacto</strong>
                <span>La información de contacto aún no está disponible.</span>
              </article>
            )}
          </div>

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

          {errorMessage && (
            <p className="form-message form-message-error">{errorMessage}</p>
          )}

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
