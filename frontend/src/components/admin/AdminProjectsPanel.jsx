import AdminImagePicker from "./AdminImagePicker";
import AdminProjectGalleryPicker from "./AdminProjectGalleryPicker";
import "./AdminProjectsPanel.css";

export default function AdminProjectsPanel({
  projects,
  skills,
  projectForm,
  savingProject,
  deletingProjectIds,
  editingProjectId,
  mediaAssets,
  validationErrors,
  onProjectChange,
  onProjectSkillToggle,
  onProjectSubmit,
  onEditProject,
  onDeleteProject,
  onCancelProjectEdit,
  onAssetUploaded,
  sessionUploadedAssets,
  onImageAssetChange,
  onProjectGalleryChange,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-projects-panel">
      <div className="section-header">
        <span className="badge">Proyectos</span>
        <h2>Portafolio de proyectos</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando proyectos...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="admin-collapsible" open={editingProjectId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">{editingProjectId ? "Editar proyecto" : "Crear nuevo proyecto"}</span>
            <p className="admin-collapsible__meta">El formulario se divide por bloques para que en móvil no aparezca como una sola lista interminable.</p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onProjectSubmit}>
            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Información básica</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="admin-form-section__stack admin-projects-panel__section-body">
                <label>
                  Título
                  <input name="title" value={projectForm.title} onChange={onProjectChange} disabled={savingProject} />
                </label>

                <div className="admin-form-section__grid">
                  <label>
                    Slug
                    <input name="slug" value={projectForm.slug} onChange={onProjectChange} disabled={savingProject} />
                  </label>

                  <label>
                    Orden
                    <input
                      name="display_order"
                      type="number"
                      value={projectForm.display_order}
                      onChange={onProjectChange}
                      disabled={savingProject}
                    />
                  </label>
                </div>

                <label>
                  Descripción corta
                  <input name="short_description" value={projectForm.short_description} onChange={onProjectChange} disabled={savingProject} />
                </label>
              </div>
            </details>

            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Descripción</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="admin-projects-panel__section-body">
                <label>
                  Descripción larga
                  <textarea name="description" rows="6" value={projectForm.description} onChange={onProjectChange} disabled={savingProject} />
                </label>
              </div>
            </details>

            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Enlaces</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="admin-form-section__grid admin-projects-panel__section-body">
                <label>
                  Repositorio
                  <input name="repository_url" value={projectForm.repository_url} onChange={onProjectChange} disabled={savingProject} />
                </label>

                <label>
                  Demo
                  <input name="demo_url" value={projectForm.demo_url} onChange={onProjectChange} disabled={savingProject} />
                </label>
              </div>
            </details>

            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Imagen y galería</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="admin-form-section__stack admin-projects-panel__section-body">
                <AdminImagePicker
                  value={projectForm.image_asset_id || null}
                  currentAsset={
                    projectForm.image_asset_id
                      ? mediaAssets?.find((asset) => asset.id === Number(projectForm.image_asset_id)) ?? null
                      : null
                  }
                  assetType="image"
                  label="Imagen principal del proyecto"
                  disabled={savingProject}
                  mediaAssets={mediaAssets || []}
                  onChange={onImageAssetChange}
                  onAssetUploaded={onAssetUploaded}
                  sessionUploadedAssets={sessionUploadedAssets}
                />

                <AdminProjectGalleryPicker
                  value={projectForm.gallery_image_ids || []}
                  mediaAssets={mediaAssets || []}
                  disabled={savingProject}
                  onChange={onProjectGalleryChange}
                  onAssetUploaded={onAssetUploaded}
                  sessionUploadedAssets={sessionUploadedAssets}
                />
              </div>
            </details>

            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Skills asociadas</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="skills-picker admin-projects-panel__section-body">
                <p className="admin-form-footer__hint">Selecciona solo las skills que realmente describen el proyecto.</p>
                <div className="chip-grid">
                  {skills.length === 0 ? (
                    <p className="muted">Crea skills para poder asociarlas a proyectos.</p>
                  ) : (
                    skills.map((skill) => (
                      <button
                        type="button"
                        key={skill.id}
                        className={`chip ${projectForm.skill_ids.includes(skill.id) ? "selected" : ""}`}
                        onClick={() => onProjectSkillToggle(skill.id)}
                        disabled={savingProject}
                      >
                        {skill.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </details>

            <details className="admin-form-section admin-projects-panel__section" open>
              <summary className="admin-projects-panel__section-summary">
                <span>Estado y orden</span>
                <span aria-hidden="true">v</span>
              </summary>
              <div className="admin-form-section__grid admin-projects-panel__section-body">
                <label className="toggle-row">
                  <input
                    name="is_featured"
                    type="checkbox"
                    checked={projectForm.is_featured}
                    onChange={onProjectChange}
                    disabled={savingProject}
                  />
                  <span>Destacado</span>
                </label>

                <label className="toggle-row">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={projectForm.is_active}
                    onChange={onProjectChange}
                    disabled={savingProject}
                  />
                  <span>Activo</span>
                </label>
              </div>
            </details>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda el proyecto cuando termines de revisar datos, assets y skills.</p>
              </div>

              <div className="form-actions-inline">
                <button type="submit" className="admin-button primary" disabled={savingProject}>
                  {savingProject ? "Guardando..." : editingProjectId ? "Actualizar proyecto" : "Crear proyecto"}
                </button>

                {editingProjectId && (
                  <button type="button" className="admin-button ghost" onClick={onCancelProjectEdit} disabled={savingProject}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list">
        {projects.length === 0 ? (
          <p className="muted">No hay proyectos registrados.</p>
        ) : (
          projects.map((project) => {
            const isDeleting = deletingProjectIds?.includes(project.id);
            const imgSrc =
              project.image?.data_base64 && project.image?.mime_type ? `data:${project.image.mime_type};base64,${project.image.data_base64}` : null;
            const galleryCount = Array.isArray(project.gallery_images) ? project.gallery_images.length : 0;

            return (
              <article className="entity-card admin-list-card" key={project.id}>
                <div className="entity-card__content">
                  <div className="entity-card__image-container">
                    {imgSrc ? (
                      <img src={imgSrc} alt={project.title} className="entity-card__image" />
                    ) : (
                      <div className="entity-card__image-placeholder">
                        <span aria-hidden="true">🖼️</span>
                      </div>
                    )}
                  </div>

                  <div className="entity-card__details">
                    <div className="admin-list-card__footer">
                      <strong>{project.title}</strong>
                      <div className="admin-meta-row">
                        {project.is_featured && <span className="admin-status-pill is-featured">Destacado</span>}
                        <span className={`admin-status-pill ${project.is_active ? "is-active" : "is-inactive"}`}>
                          {project.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {project.slug && <span className="admin-meta-chip admin-text-break-safe">Slug: {project.slug}</span>}
                    {project.short_description && <p>{project.short_description}</p>}

                    <div className="admin-meta-row">
                      <span className="admin-meta-chip">Orden {project.display_order}</span>
                      <span className="admin-meta-chip">Galería: {galleryCount} imagen(es)</span>
                    </div>

                    {Array.isArray(project.skills) && project.skills.length > 0 && (
                      <div className="chip-grid compact admin-projects-panel__skills">
                        {project.skills.map((skill) => (
                          <span className="chip readonly" key={`${project.id}-${skill.id}`}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="entity-actions">
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => onEditProject(project)}
                    disabled={savingProject || isDeleting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => onDeleteProject(project.id)}
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
