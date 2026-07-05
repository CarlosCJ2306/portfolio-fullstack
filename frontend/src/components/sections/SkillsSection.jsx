import { getSafeSvgDataUrl } from "../../utils/svgSecurity";
import "./SkillsSection.css";

export default function SkillsSection({ skills = [] }) {
  /*
    Este componente recibe las habilidades desde HomePage.jsx.

    Datos esperados desde el JSON:
    skills: lista de habilidades técnicas guardadas en el backend.

    Cada skill podría traer campos como:
    - name
    - title
    - category
    - level
    - icon
    - icon_svg
  */

  const hasSkills = Array.isArray(skills) && skills.length > 0;

  if (!hasSkills) {
    return (
      <section id="skills" className="skills-section">
        <div className="container">
          <span className="badge">Skills</span>

          {/* Aquí aparece un mensaje temporal si el backend todavía no envía skills. */}
          <h2 className="section-title">Habilidades técnicas</h2>

          <p className="section-description">
            Aún no hay habilidades registradas para mostrar.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="skills-section">
      <div className="container">
        <div className="section-heading">
          {/* Etiqueta visual de la sección. */}
          <span className="badge">Skills</span>

          {/* Título principal de la sección. */}
          <h2 className="section-title">Habilidades técnicas</h2>

          {/* Descripción corta para explicar qué se está mostrando. */}
          <p className="section-description">
            Tecnologías, herramientas y conocimientos que hacen parte de mi
            perfil como desarrollador.
          </p>
        </div>

        <div className="skills-grid">
          {/* Aquí se recorre la lista de skills recibida desde el JSON del backend. */}
          {skills.map((skill) => {
            const skillName =
              skill.name || skill.title || skill.skill_name || "Skill";

            const category =
              skill.category || skill.type || "Tecnología";

            const level =
              skill.level || skill.proficiency || skill.level_name || "";

            const safeSvgSrc = getSafeSvgDataUrl(skill.icon?.svg_content);

            return (
              <article
                className="skill-card"
                key={skill.id || skillName}
              >
                {/* 
                  Ícono visual simple.
                  Si luego el backend entrega SVG controlado, podemos renderizarlo aquí.
                */}
                <div className="skill-icon">
                  {safeSvgSrc ? (
                    <img
                      src={safeSvgSrc}
                      alt={skill.icon?.alt_text || skillName}
                      className="skill-icon-img"
                    />
                  ) : skill.icon?.data_base64 && skill.icon?.mime_type ? (
                    <img 
                      src={`data:${skill.icon.mime_type};base64,${skill.icon.data_base64}`} 
                      alt={skillName} 
                      className="skill-icon-img"
                    />
                  ) : (
                    skillName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="skill-content">
                  {/* Nombre de la habilidad. */}
                  <h3>{skillName}</h3>

                  {/* Categoría de la habilidad. */}
                  <p>{category}</p>

                  {/* Nivel opcional, solo aparece si el JSON lo trae. */}
                  {level && <span>{level}</span>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
