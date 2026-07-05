import AdminImagePicker from "./AdminImagePicker";
import { getSafeSvgDataUrl } from "../../utils/svgSecurity";
import "./AdminSkillsPanel.css";

export default function AdminSkillsPanel({
  skills,
  skillForm,
  savingSkill,
  editingSkillId,
  mediaAssets,
  onSkillChange,
  onSkillSubmit,
  onEditSkill,
  onDeleteSkill,
  onCancelSkillEdit,
  onAssetUploaded,
  onIconAssetChange,
}) {
  return (
    <article className="admin-card admin-skills-panel">
      <div className="section-header">
        <span className="badge">Skills</span>
        <h2>{editingSkillId ? "Editar skill" : "Crear skill"}</h2>
      </div>

      <form className="admin-form" onSubmit={onSkillSubmit}>
        <div className="form-row">
          <label>
            Nombre
            <input name="name" value={skillForm.name} onChange={onSkillChange} disabled={savingSkill} />
          </label>

          <label>
            Categoría
            <input name="category" value={skillForm.category} onChange={onSkillChange} disabled={savingSkill} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Nivel
            <input name="level" value={skillForm.level} onChange={onSkillChange} disabled={savingSkill} />
          </label>

          <label>
            Color (hex)
            <input name="color" value={skillForm.color} onChange={onSkillChange} placeholder="#3776AB" disabled={savingSkill} />
          </label>
        </div>

        {/* Selector visual de ícono SVG */}
        <AdminImagePicker
          value={skillForm.icon_asset_id || null}
          currentAsset={
            skillForm.icon_asset_id
              ? mediaAssets?.find((a) => a.id === Number(skillForm.icon_asset_id)) ?? null
              : null
          }
          assetType="icon_svg"
          label="Ícono (SVG o imagen)"
          disabled={savingSkill}
          mediaAssets={mediaAssets || []}
          onChange={onIconAssetChange}
          onAssetUploaded={onAssetUploaded}
        />

        <label>
          Orden de visualización
          <input name="display_order" type="number" value={skillForm.display_order} onChange={onSkillChange} disabled={savingSkill} />
        </label>

        <label className="toggle-row">
          <input
            name="is_active"
            type="checkbox"
            checked={skillForm.is_active}
            onChange={onSkillChange}
            disabled={savingSkill}
          />
          <span>Activo</span>
        </label>

        <div className="form-actions-inline">
          <button type="submit" className="admin-button primary" disabled={savingSkill}>
            {savingSkill ? "Guardando..." : editingSkillId ? "Actualizar skill" : "Crear skill"}
          </button>

          {editingSkillId && (
            <button type="button" className="admin-button ghost" onClick={onCancelSkillEdit} disabled={savingSkill}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="entity-list">
        {skills.length === 0 ? (
          <p className="muted">No hay skills registradas.</p>
        ) : (
          skills.map((skill) => {
            const iconSrc = skill.icon?.data_base64 && skill.icon?.mime_type
              ? `data:${skill.icon.mime_type};base64,${skill.icon.data_base64}`
              : null;
            const safeSvgSrc = getSafeSvgDataUrl(skill.icon?.svg_content);

            return (
              <article className="entity-card" key={skill.id}>
                <div className="entity-card__content">
                  {/* Preview del ícono en la lista */}
                  <div className="entity-card__icon">
                    {iconSrc ? (
                      <img src={iconSrc} alt={skill.name} className="entity-card__icon-img" />
                    ) : safeSvgSrc ? (
                      <img
                        src={safeSvgSrc}
                        alt={skill.icon?.alt_text || skill.name}
                        className="entity-card__icon-img"
                      />
                    ) : (
                      <div className="entity-card__icon-placeholder">
                        {skill.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong>{skill.name}</strong>
                    <p>{skill.category} · {skill.level}</p>
                    <span className="entity-meta">
                      Orden {skill.display_order} · {skill.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>

                <div className="entity-actions">
                  <button type="button" className="admin-button secondary" onClick={() => onEditSkill(skill)}>
                    Editar
                  </button>
                  <button type="button" className="admin-button ghost" onClick={() => onDeleteSkill(skill.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}
