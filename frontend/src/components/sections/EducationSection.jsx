import "./EducationSection.css";

export default function EducationSection({ education = [] }) {
  /*
    Este componente recibe la formaciÃ³n acadÃ©mica desde HomePage.jsx.

    Datos esperados desde el JSON:
    - education: lista de estudios o formaciÃ³n acadÃ©mica.

    Cada registro podrÃ­a traer campos como:
    - institution
    - degree / title / program
    - field_of_study / field / area
    - start_year / start_date
    - end_year / end_date
    - status
    - description
  */

  const hasEducation = Array.isArray(education) && education.length > 0;

  if (!hasEducation) {
    return (
      <section id="education" className="education-section">
        <div className="container">
          <div className="education-heading">
            <span className="badge">EducaciÃ³n</span>

            {/* AquÃ­ aparece un mensaje controlado si no hay educaciÃ³n registrada. */}
            <h2>FormaciÃ³n acadÃ©mica</h2>

            <p>
              AÃºn no hay informaciÃ³n acadÃ©mica registrada para mostrar en el
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
          {/* Etiqueta visual de la secciÃ³n. */}
          <span className="badge">EducaciÃ³n</span>

          {/* TÃ­tulo principal de la secciÃ³n. */}
          <h2>FormaciÃ³n acadÃ©mica</h2>

          {/* DescripciÃ³n corta de la secciÃ³n. */}
          <p>
            Base acadÃ©mica que respalda mi perfil tÃ©cnico, mi capacidad de
            anÃ¡lisis y mi enfoque en construcciÃ³n de soluciones de software.
          </p>
        </div>

        <div className="education-grid">
          {/* AquÃ­ se recorre la lista de formaciÃ³n acadÃ©mica recibida desde el backend. */}
          {education.map((item) => {
            const institution =
              item.institution ||
              item.institution_name ||
              item.school ||
              "InstituciÃ³n educativa";

            const degree =
              item.degree ||
              item.title ||
              item.program ||
              "Programa acadÃ©mico";

            const field =
              item.field_of_study ||
              item.field ||
              item.area ||
              item.specialty ||
              "";

            const startDate =
              item.start_year ||
              item.start_date ||
              item.start ||
              "";

            const endDate =
              item.end_year ||
              item.end_date ||
              item.end ||
              item.graduation_date ||
              "";

            const status =
              item.status ||
              item.current_status ||
              "";

            const description =
              item.description ||
              item.summary ||
              "";

            return (
              <article
                className="education-card"
                key={item.id || `${institution}-${degree}`}
              >
                <div className="education-icon">
                  ðŸŽ“
                </div>

                <div className="education-content">
                  {/* AquÃ­ debe aparecer el programa o tÃ­tulo acadÃ©mico. */}
                  <h3>{degree}</h3>

                  {/* AquÃ­ debe aparecer la instituciÃ³n educativa. */}
                  <strong>{institution}</strong>

                  {/* AquÃ­ debe aparecer el Ã¡rea de formaciÃ³n si el JSON la trae. */}
                  {field && <p className="education-field">{field}</p>}

                  {/* AquÃ­ debe aparecer el periodo acadÃ©mico si existen fechas. */}
                  {(startDate || endDate) && (
                    <span className="education-date">
                      {startDate} {startDate && endDate ? "â€”" : ""} {endDate}
                    </span>
                  )}

                  {/* AquÃ­ debe aparecer el estado acadÃ©mico si existe. */}
                  {status && <span className="education-status">{status}</span>}

                  {/* AquÃ­ debe aparecer una descripciÃ³n corta del estudio. */}
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
