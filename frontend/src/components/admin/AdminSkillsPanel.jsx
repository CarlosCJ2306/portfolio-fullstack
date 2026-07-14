import AdminImagePicker from "./AdminImagePicker";
import { getSafeSvgDataUrl } from "../../utils/svgSecurity";
import { buildLegacyAssetDataUrl } from "../../utils/mediaContent";
import { useAdminMediaObjectUrl } from "../../utils/useAdminMediaObjectUrl";
import "./AdminSkillsPanel.css";

function AdminSkillIcon({ skill }) {
  const { objectUrl } = useAdminMediaObjectUrl(skill.icon, {
    enabled: Boolean(skill.icon?.content_url),
  });
  const iconSrc =
    objectUrl
    || buildLegacyAssetDataUrl(skill.icon)
    || getSafeSvgDataUrl(skill.icon?.svg_content);

  if (!iconSrc) {
    return (
      <div className="entity-card__icon-placeholder">
        {skill.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={skill.icon?.alt_text || skill.name}
      className="entity-card__icon-img"
      loading="lazy"
    />
  );
}

export default function AdminSkillsPanel({
  skills,
  skillForm,
  suggestedDisplayOrder,
  formRef,
  firstFieldRef,
  savingSkill,
  deletingSkillIds,
  editingSkillId,
  mediaAssets,
  validationErrors,
  onSkillChange,
  onSkillSubmit,
  onEditSkill,
  onDeleteSkill,
  onCancelSkillEdit,
  onAssetUploaded,
  sessionUploadedAssets,
  onIconAssetChange,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-skills-panel">
      <div className="section-header">
        <span className="badge">Skills</span>
        <h2>Skills y tecnologías</h2>
      </div>

      {panelError && (
        <div className="form-actions-inline">
          <p className="admin-message error">{panelError}</p>
          {onRetry && (
            <button type="button" className="admin-button ghost" onClick={onRetry} disabled={panelLoading}>
              {panelLoading ? "Reintentando..." : "Reintentar"}
            </button>
          )}
        </div>
      )}

      {!panelError && panelLoading && <p className="muted">Actualizando skills...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details ref={formRef} className="admin-collapsible" open={editingSkillId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">{editingSkillId ? "Editar skill" : "Crear nueva skill"}</span>
            <p className="admin-collapsible__meta">Mantén este bloque compacto en móvil y abre solo cuando vayas a crear o editar.</p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onSkillSubmit}>
            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Datos principales</h3>
                <p>Nombre, categoría y nivel de la tecnología o habilidad.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Nombre
                  <input ref={firstFieldRef} name="name" value={skillForm.name} onChange={onSkillChange} disabled={savingSkill} />
                </label>

                <label>
                  Categoría
                  <input name="category" value={skillForm.category} onChange={onSkillChange} disabled={savingSkill} />
                </label>

                <label>
                  Nivel
                  <input name="level" value={skillForm.level} onChange={onSkillChange} disabled={savingSkill} />
                </label>

                <label>
                  Color (hex)
                  <input name="color" value={skillForm.color} onChange={onSkillChange} placeholder="#3776AB" disabled={savingSkill} />
                </label>
              </div>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Ícono y apariencia</h3>
                <p>Selecciona un ícono seguro o sube uno compatible con la política actual.</p>
              </div>

              <AdminImagePicker
                value={skillForm.icon_asset_id || null}
                currentAsset={
                  skillForm.icon_asset_id
                    ? mediaAssets?.find((asset) => asset.id === Number(skillForm.icon_asset_id)) ?? null
                    : null
                }
                assetType="icon_svg"
                label="Ícono (SVG o imagen)"
                disabled={savingSkill}
                mediaAssets={mediaAssets || []}
                onChange={onIconAssetChange}
                onAssetUploaded={onAssetUploaded}
                sessionUploadedAssets={sessionUploadedAssets}
              />
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Visibilidad y orden</h3>
                <p>Controla cómo aparece la skill en la vista pública.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Orden de visualización
                  <input
                    name="display_order"
                    type="number"
                    value={skillForm.display_order}
                    onChange={onSkillChange}
                    disabled={savingSkill}
                  />
                  {!editingSkillId && (
                    <span className="muted">
                      Déjalo vacío para asignar automáticamente el siguiente orden. Sugerido: {suggestedDisplayOrder}.
                    </span>
                  )}
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
              </div>
            </section>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda la skill o cancela la edición en curso.</p>
              </div>

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
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list">
        {skills.length === 0 ? (
          <p className="muted">No hay skills registradas.</p>
        ) : (
          skills.map((skill) => {
            const isDeleting = deletingSkillIds?.includes(skill.id);

            return (
              <article className="entity-card admin-list-card" key={skill.id}>
                <div className="entity-card__content">
                  <div className="entity-card__icon">
                    <AdminSkillIcon skill={skill} />
                  </div>

                  <div className="admin-stack">
                    <div className="admin-list-card__footer">
                      <strong>{skill.name}</strong>
                      <span className={`admin-status-pill ${skill.is_active ? "is-active" : "is-inactive"}`}>
                        {skill.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    <div className="admin-meta-row">
                      <span className="admin-meta-chip">{skill.category || "Sin categoría"}</span>
                      <span className="admin-meta-chip">Nivel: {skill.level || "Sin definir"}</span>
                      <span className="admin-meta-chip">Orden {skill.display_order}</span>
                    </div>
                  </div>
                </div>

                <div className="entity-actions">
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => onEditSkill(skill)}
                    disabled={savingSkill || isDeleting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => onDeleteSkill(skill.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
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
