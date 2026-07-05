import "./ExperienceSection.css";

export default function ExperienceSection({ experiences = [] }) {
  /*
    Este componente recibe la experiencia profesional desde HomePage.jsx.

    Datos esperados desde el JSON:
    - experiences: lista de experiencias laborales/profesionales.

    Cada experiencia podría traer campos como:
    - company
    - role / position / title
    - start_date
    - end_date
    - location
    - description
    - bullets / experience_bullets / responsibilities
  */

  const hasExperiences =
    Array.isArray(experiences) && experiences.length > 0;

  if (!hasExperiences) {
    return (
      <section id="experience" className="experience-section">
        <div className="container">
          <div className="experience-heading">
            <span className="badge">Experiencia</span>

            {/* Aquí aparece un mensaje controlado si el backend todavía no envía experiencia. */}
            <h2>Experiencia profesional</h2>

            <p>
              Aún no hay experiencias registradas para mostrar en el portafolio.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="experience" className="experience-section">
      <div className="container">
        <div className="experience-heading">
          {/* Etiqueta visual de la sección. */}
          <span className="badge">Experiencia</span>

          {/* Título principal de la sección. */}
          <h2>Experiencia profesional</h2>

          {/* Descripción corta de la sección. */}
          <p>
            Recorrido práctico en desarrollo de soluciones, automatización,
            backend, bases de datos e integración de sistemas.
          </p>
        </div>

        <div className="experience-timeline">
          {/* Aquí se recorre la lista de experiencias recibidas desde el JSON del backend. */}
          {experiences.map((experience) => {
            const role =
              experience.role ||
              experience.position ||
              experience.title ||
              "Cargo profesional";

            const company =
              experience.company ||
              experience.company_name ||
              experience.organization ||
              "Empresa / Organización";

            const location =
              experience.location ||
              experience.city ||
              "";

            const startDate =
              experience.start_date ||
              experience.start ||
              "";

            const endDate =
              experience.end_date ||
              experience.end ||
              experience.finish_date ||
              "Actualidad";

            const description =
              experience.description ||
              experience.summary ||
              "";

            const bullets =
              experience.bullets ||
              experience.experience_bullets ||
              experience.responsibilities ||
              experience.achievements ||
              [];

            return (
              <article
                className="experience-card"
                key={experience.id || `${company}-${role}`}
              >
                <div className="experience-marker" />

                <div className="experience-content">
                  <div className="experience-top">
                    <div>
                      {/* Aquí debe aparecer el cargo o rol profesional. */}
                      <h3>{role}</h3>

                      {/* Aquí debe aparecer la empresa u organización. */}
                      <strong>{company}</strong>
                    </div>

                    {/* Aquí debe aparecer el rango de fechas de la experiencia. */}
                    {(startDate || endDate) && (
                      <span className="experience-date">
                        {startDate} {startDate && endDate ? "—" : ""} {endDate}
                      </span>
                    )}
                  </div>

                  {/* Aquí debe aparecer la ubicación si el JSON la trae. */}
                  {location && <p className="experience-location">📍 {location}</p>}

                  {/* Aquí debe aparecer una descripción general de la experiencia. */}
                  {description && (
                    <p className="experience-description">{description}</p>
                  )}

                  {Array.isArray(bullets) && bullets.length > 0 && (
                    <ul className="experience-list">
                      {/* Aquí deben aparecer responsabilidades, funciones o logros asociados. */}
                      {bullets.map((item, index) => {
                        const text =
                          item.text ||
                          item.description ||
                          item.bullet ||
                          item;

                        return <li key={`${role}-${index}`}>{text}</li>;
                      })}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}