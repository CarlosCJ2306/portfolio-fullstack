import AdminImagePicker from "./AdminImagePicker";
import AdminProjectGalleryPicker from "./AdminProjectGalleryPicker";
import "./AdminProjectsPanel.css";

export default function AdminProjectsPanel({
  projects,
  skills,
  projectForm,
  savingProject,
  editingProjectId,
  mediaAssets,
  onProjectChange,
  onProjectSkillToggle,
  onProjectSubmit,
  onEditProject,
  onDeleteProject,
  onCancelProjectEdit,
  onAssetUploaded,
  onImageAssetChange,
  onProjectGalleryChange,
  panelError,
  panelLoading,
  onRetry,
}) {
  return (
    <article className="admin-card admin-projects-panel">
      <div className="section-header">
        <span className="badge">Proyectos</span>
        <h2>{editingProjectId ? "Editar proyecto" : "Crear proyecto"}</h2>
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

      <form className="admin-form" onSubmit={onProjectSubmit}>
        <label>
          Título
          <input name="title" value={projectForm.title} onChange={onProjectChange} disabled={savingProject} />
        </label>

        <div className="form-row">
          <label>
            Slug
            <input name="slug" value={projectForm.slug} onChange={onProjectChange} disabled={savingProject} />
          </label>

          <label>
            Orden
            <input name="display_order" type="number" value={projectForm.display_order} onChange={onProjectChange} disabled={savingProject} />
          </label>
        </div>

        <label>
          Descripción corta
          <input name="short_description" value={projectForm.short_description} onChange={onProjectChange} disabled={savingProject} />
        </label>

        <label>
          Descripción larga
          <textarea name="description" rows="6" value={projectForm.description} onChange={onProjectChange} disabled={savingProject} />
        </label>

        <div className="form-row">
          <label>
            Repositorio
            <input name="repository_url" value={projectForm.repository_url} onChange={onProjectChange} disabled={savingProject} />
          </label>

          <label>
            Demo
            <input name="demo_url" value={projectForm.demo_url} onChange={onProjectChange} disabled={savingProject} />
          </label>
        </div>

        {/* Selector visual de imagen del proyecto */}
        <AdminImagePicker
          value={projectForm.image_asset_id || null}
          currentAsset={
            projectForm.image_asset_id
              ? mediaAssets?.find((a) => a.id === Number(projectForm.image_asset_id)) ?? null
              : null
          }
          assetType="image"
          label="Imagen del proyecto"
          disabled={savingProject}
          mediaAssets={mediaAssets || []}
          onChange={onImageAssetChange}
          onAssetUploaded={onAssetUploaded}
        />

        <AdminProjectGalleryPicker
          value={projectForm.gallery_image_ids || []}
          mediaAssets={mediaAssets || []}
          disabled={savingProject}
          onChange={onProjectGalleryChange}
          onAssetUploaded={onAssetUploaded}
        />

        <div className="form-row">
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

        <div className="skills-picker">
          <strong>Skills asociadas</strong>
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
      </form>

      <div className="entity-list">
        {projects.length === 0 ? (
          <p className="muted">No hay proyectos registrados.</p>
        ) : (
          projects.map((project) => {
            const imgSrc = project.image?.data_base64 && project.image?.mime_type
              ? `data:${project.image.mime_type};base64,${project.image.data_base64}`
              : null;

            return (
              <article className="entity-card" key={project.id}>
                <div className="entity-card__content">
                  {/* Preview de imagen en la lista */}
                  <div className="entity-card__image-container">
                    {imgSrc ? (
                      <img src={imgSrc} alt={project.title} className="entity-card__image" />
                    ) : (
                      <div className="entity-card__image-placeholder">
                        <span className="icon">🖼️</span>
                      </div>
                    )}
                  </div>

                  <div className="entity-card__details">
                    <strong>{project.title}</strong>
                    <p>{project.short_description}</p>
                    <span className="entity-meta">
                      Orden {project.display_order} · {project.is_featured ? "Destacado" : "Normal"} · {project.is_active ? "Activo" : "Inactivo"}
                    </span>

                    <span className="entity-meta entity-meta--secondary">
                      Galeria: {Array.isArray(project.gallery_images) ? project.gallery_images.length : 0} imagen(es)
                    </span>

                    {Array.isArray(project.skills) && project.skills.length > 0 && (
                      <div className="chip-grid compact" style={{ marginTop: '8px' }}>
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
                  <button type="button" className="admin-button secondary" onClick={() => onEditProject(project)}>
                    Editar
                  </button>
                  <button type="button" className="admin-button ghost" onClick={() => onDeleteProject(project.id)}>
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
