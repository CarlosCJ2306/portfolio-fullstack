import "./EducationSection.css";

function formatYearValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function formatEducationPeriod(item) {
  const startYear = formatYearValue(
    item.start_year || item.start_date || item.start
  );
  const endYear = formatYearValue(
    item.end_year || item.end_date || item.end || item.graduation_date
  );

  if (item?.is_current) {
    if (startYear) {
      return `${startYear} - Actualidad`;
    }

    return "Actualidad";
  }

  if (startYear && endYear) {
    return `${startYear} - ${endYear}`;
  }

  if (startYear) {
    return `Desde ${startYear}`;
  }

  return endYear;
}

export default function EducationSection({ education = [] }) {
  const hasEducation = Array.isArray(education) && education.length > 0;

  if (!hasEducation) {
    return (
      <section id="education" className="education-section">
        <div className="container">
          <div className="education-heading">
            <span className="badge">Educacion</span>
            <h2>Formacion academica</h2>
            <p>
              Aún no hay información académica registrada para mostrar en el
              portafolio.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="education" className="education-section">
      <div className="container">
        <div className="education-heading">
          <span className="badge">Educacion</span>
          <h2>Formación académica</h2>
          <p>
            Base académica que respalda mi perfil técnico, mi capacidad de
            análisis y mi enfoque en construcción de soluciones de software.
          </p>
        </div>

        <div className="education-grid">
          {education.map((item) => {
            const institution =
              item.institution ||
              item.institution_name ||
              item.school ||
              "Institucion educativa";

            const degree =
              item.degree ||
              item.title ||
              item.program ||
              "Programa academico";

            const field =
              item.field_of_study ||
              item.field ||
              item.area ||
              item.specialty ||
              "";

            const period = formatEducationPeriod(item);
            const description =
              item.description ||
              item.summary ||
              "";

            return (
              <article
                className="education-card"
                key={item.id || `${institution}-${degree}`}
              >
                <div className="education-icon">🎓</div>

                <div className="education-content">
                  <h3>{degree}</h3>
                  <strong>{institution}</strong>

                  {field && <p className="education-field">{field}</p>}

                  {period && <span className="education-date">{period}</span>}

                  {description && (
                    <p className="education-description">{description}</p>
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
