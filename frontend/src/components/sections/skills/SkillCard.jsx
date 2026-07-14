import { useMemo, useState } from "react";
import { getSafeSvgDataUrl } from "../../../utils/svgSecurity";
import {
  buildLegacyAssetDataUrl,
  resolveMediaContentUrl,
} from "../../../utils/mediaContent";

function normalizeText(skill, keys, fallback = "") {
  for (const key of keys) {
    const value = skill?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function resolveSkillIcon(skill) {
  const safeSvgUrl = getSafeSvgDataUrl(skill?.icon?.svg_content);

  return (
    resolveMediaContentUrl(skill?.icon) ||
    safeSvgUrl ||
    buildLegacyAssetDataUrl(skill?.icon)
  );
}

export default function SkillCard({ skill }) {
  const [iconFailed, setIconFailed] = useState(false);

  const skillName = normalizeText(
    skill,
    ["name", "title", "skill_name"],
    "Skill",
  );
  const category = normalizeText(skill, ["category", "type"], "Tecnología");
  const level = normalizeText(skill, ["level", "proficiency", "level_name"]);
  const iconSource = useMemo(() => resolveSkillIcon(skill), [skill]);
  const imageAlt = normalizeText(skill?.icon, ["alt_text"], skillName);
  const showIconImage = Boolean(iconSource) && !iconFailed;

  return (
    <article className="skill-card">
      <div className="skill-icon" aria-hidden="true">
        {showIconImage ? (
          <img
            src={iconSource}
            alt={imageAlt}
            className="skill-icon-img"
            loading="lazy"
            decoding="async"
            draggable="false"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="skill-icon-fallback">
            {skillName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="skill-content">
        <h3>{skillName}</h3>
        {level ? <span className="skill-level">{level}</span> : null}
        {category ? <p>{category}</p> : null}
      </div>
    </article>
  );
}
