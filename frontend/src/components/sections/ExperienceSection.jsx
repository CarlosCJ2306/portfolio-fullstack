import "./ExperienceSection.css";

function formatDateValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return String(value);
}

function formatExperiencePeriod(experience) {
  if (experience?.is_current) {
    const startLabel = formatDateValue(experience.start_date || experience.start);
    return startLabel ? `${startLabel} - Actualidad` : "Actualidad";
  }

  const startLabel = formatDateValue(
    experience?.start_date || experience?.start
  );
  const endLabel = formatDateValue(
    experience?.end_date || experience?.end || experience?.finish_date
  );

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel || endLabel || "";
}

function formatLocation(experience) {
  const city = experience?.city || "";
  const country = experience?.country || "";
  const locationParts = [city, country].filter(Boolean);

  if (locationParts.length > 0) {
    return locationParts.join(", ");
  }

  return experience?.location || "";
}

export default function ExperienceSection({ experiences = [] }) {
  const hasExperiences = Array.isArray(experiences) && experiences.length > 0;

  if (!hasExperiences) {
    return (
      <section id="experience" className="experience-section">
        <div className="container">
          <div className="experience-heading">
            <span className="badge">Experiencia</span>
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
          <span className="badge">Experiencia</span>
            <h2>Experiencia profesional</h2>
            <p>
              Recorrido práctico en desarrollo de soluciones, automatización,
              backend, bases de datos e integración de sistemas.
            </p>
        </div>

        <div className="experience-timeline">
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
              "Empresa / Organizacion";

            const location = formatLocation(experience);
            const period = formatExperiencePeriod(experience);

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
                      <h3>{role}</h3>
                      <strong>{company}</strong>
                    </div>

                    {period && <span className="experience-date">{period}</span>}
                  </div>

                  {location && (
                    <p className="experience-location">📍 {location}</p>
                  )}

                  {description && (
                    <p className="experience-description">{description}</p>
                  )}

                  {Array.isArray(bullets) && bullets.length > 0 && (
                    <ul className="experience-list">
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
