import "./AdminExperiencePanel.css";

export default function AdminExperiencePanel({
  experiences,
  experienceForm,
  savingExperience,
  deletingExperienceIds,
  editingExperienceId,
  validationErrors,
  onExperienceChange,
  onExperienceSubmit,
  onEditExperience,
  onDeleteExperience,
  onCancelExperienceEdit,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-experience-panel">
      <div className="section-header">
        <span className="badge">Experiencia</span>
        <h2>Experiencia profesional</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando experiencia...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="admin-collapsible" open={editingExperienceId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">{editingExperienceId ? "Editar experiencia" : "Crear nueva experiencia"}</span>
            <p className="admin-collapsible__meta">Agrupa cargo, fechas y descripción para que la edición sea más clara en móvil.</p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onExperienceSubmit}>
            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Cargo y empresa</h3>
                <p>Información principal de la experiencia.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Cargo
                  <input name="position" value={experienceForm.position} onChange={onExperienceChange} disabled={savingExperience} />
                </label>

                <label>
                  Empresa
                  <input name="company" value={experienceForm.company} onChange={onExperienceChange} disabled={savingExperience} />
                </label>
              </div>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Fechas y ubicación</h3>
                <p>Usa “Actualmente activo” cuando el rol siga vigente.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  País
                  <input name="country" value={experienceForm.country} onChange={onExperienceChange} disabled={savingExperience} />
                </label>

                <label>
                  Ciudad
                  <input name="city" value={experienceForm.city} onChange={onExperienceChange} disabled={savingExperience} />
                </label>

                <label>
                  Inicio
                  <input name="start_date" type="date" value={experienceForm.start_date} onChange={onExperienceChange} disabled={savingExperience} />
                </label>

                <label>
                  Fin
                  <input
                    name="end_date"
                    type="date"
                    value={experienceForm.end_date}
                    onChange={onExperienceChange}
                    disabled={savingExperience || experienceForm.is_current}
                  />
                </label>
              </div>

              <label className="toggle-row">
                <input name="is_current" type="checkbox" checked={experienceForm.is_current} onChange={onExperienceChange} disabled={savingExperience} />
                <span>Actualmente activo</span>
              </label>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Descripción y bullets</h3>
                <p>Resume el rol y lista responsabilidades o logros clave.</p>
              </div>

              <label>
                Descripción
                <textarea name="description" rows="4" value={experienceForm.description} onChange={onExperienceChange} disabled={savingExperience} />
              </label>

              <label>
                Bullets
                <textarea
                  name="bullets_text"
                  rows="5"
                  value={experienceForm.bullets_text}
                  onChange={onExperienceChange}
                  placeholder="Una responsabilidad o logro por línea"
                  disabled={savingExperience}
                />
              </label>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Estado y orden</h3>
                <p>Define visibilidad y prioridad en la línea de tiempo.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Orden
                  <input
                    name="display_order"
                    type="number"
                    value={experienceForm.display_order}
                    onChange={onExperienceChange}
                    disabled={savingExperience}
                  />
                </label>

                <label className="toggle-row">
                  <input name="is_active" type="checkbox" checked={experienceForm.is_active} onChange={onExperienceChange} disabled={savingExperience} />
                  <span>Activo</span>
                </label>
              </div>
            </section>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda la experiencia o cancela la edición actual.</p>
              </div>

              <div className="form-actions-inline">
                <button type="submit" className="admin-button primary" disabled={savingExperience}>
                  {savingExperience ? "Guardando..." : editingExperienceId ? "Actualizar experiencia" : "Crear experiencia"}
                </button>

                {editingExperienceId && (
                  <button type="button" className="admin-button ghost" onClick={onCancelExperienceEdit} disabled={savingExperience}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list timeline-list">
        {experiences.length === 0 ? (
          <p className="muted">No hay experiencias registradas.</p>
        ) : (
          experiences.map((experience) => {
            const isDeleting = deletingExperienceIds?.includes(experience.id);

            return (
              <article className="experience-admin-card admin-list-card" key={experience.id}>
                <div className="experience-admin-marker" />
                <div className="experience-admin-content">
                  <div className="experience-admin-top">
                    <div className="admin-stack">
                      <strong>{experience.position}</strong>
                      <p>{experience.company}</p>
                    </div>
                    <span className={`admin-status-pill ${experience.is_active ? "is-active" : "is-inactive"}`}>
                      {experience.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="admin-meta-row">
                    <span className="admin-meta-chip">
                      {experience.start_date}
                      {experience.end_date ? ` - ${experience.end_date}` : experience.is_current ? " - Actualidad" : ""}
                    </span>
                    {experience.is_current && <span className="admin-status-pill is-featured">Actual</span>}
                    <span className="admin-meta-chip">Orden {experience.display_order}</span>
                  </div>

                  {(experience.country || experience.city) && (
                    <span className="experience-admin-location">{[experience.city, experience.country].filter(Boolean).join(", ")}</span>
                  )}

                  {experience.description && <p className="experience-admin-description">{experience.description}</p>}

                  {Array.isArray(experience.bullets) && experience.bullets.length > 0 && (
                    <ul className="experience-admin-list">
                      {experience.bullets.map((bullet) => (
                        <li key={bullet.id || bullet.description}>{bullet.description}</li>
                      ))}
                    </ul>
                  )}

                  <div className="entity-actions">
                    <button
                      type="button"
                      className="admin-button secondary"
                      onClick={() => onEditExperience(experience)}
                      disabled={savingExperience || isDeleting}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-button ghost"
                      onClick={() => onDeleteExperience(experience.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}
