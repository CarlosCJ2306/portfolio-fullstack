import { useMemo } from "react";
import SkillsCarousel from "./skills/SkillsCarousel";
import "./SkillsSection.css";

function getSortValue(skill) {
  const displayOrder = Number(skill?.display_order);
  const id = Number(skill?.id);

  return {
    displayOrder: Number.isFinite(displayOrder)
      ? displayOrder
      : Number.POSITIVE_INFINITY,
    id: Number.isFinite(id) ? id : Number.POSITIVE_INFINITY,
  };
}

function groupSkillsIntoColumns(skills) {
  const columns = [];

  for (let index = 0; index < skills.length; index += 3) {
    columns.push(skills.slice(index, index + 3));
  }

  return columns;
}

export default function SkillsSection({ skills = [] }) {
  const orderedSkills = useMemo(() => {
    if (!Array.isArray(skills)) {
      return [];
    }

    return [...skills].sort((left, right) => {
      const leftSort = getSortValue(left);
      const rightSort = getSortValue(right);

      if (leftSort.displayOrder !== rightSort.displayOrder) {
        return leftSort.displayOrder - rightSort.displayOrder;
      }

      if (leftSort.id !== rightSort.id) {
        return leftSort.id - rightSort.id;
      }

      return 0;
    });
  }, [skills]);

  const skillColumns = useMemo(
    () => groupSkillsIntoColumns(orderedSkills),
    [orderedSkills],
  );

  if (!orderedSkills.length) {
    return (
      <section id="skills" className="skills-section">
        <div className="container">
          <span className="badge">Skills</span>
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
        <div className="skills-section-heading">
          <div>
            <span className="badge">Skills</span>
            <h2 className="section-title">Habilidades técnicas</h2>
            <p className="section-description">
              Tecnologías, herramientas y conocimientos que hacen parte de mi
              perfil como desarrollador.
            </p>
          </div>
        </div>

        <SkillsCarousel columns={skillColumns} />
      </div>
    </section>
  );
}
