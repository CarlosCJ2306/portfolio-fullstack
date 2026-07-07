import "./AdminEducationPanel.css";

export default function AdminEducationPanel({
  education,
  educationForm,
  savingEducation,
  deletingEducationIds,
  editingEducationId,
  validationErrors,
  onEducationChange,
  onEducationSubmit,
  onEditEducation,
  onDeleteEducation,
  onCancelEducationEdit,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-education-panel">
      <div className="section-header">
        <span className="badge">Educación</span>
        <h2>Formación académica</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando educación...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="admin-collapsible" open={editingEducationId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">{editingEducationId ? "Editar educación" : "Crear nueva educación"}</span>
            <p className="admin-collapsible__meta">Agrupa institución, programa, años y descripción para trabajar mejor en pantallas pequeñas.</p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onEducationSubmit}>
            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Institución y programa</h3>
                <p>Datos principales de la formación académica.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Institución
                  <input name="institution" value={educationForm.institution} onChange={onEducationChange} disabled={savingEducation} />
                </label>

                <label>
                  Título
                  <input name="degree" value={educationForm.degree} onChange={onEducationChange} disabled={savingEducation} />
                </label>

                <label>
                  Área
                  <input name="field_of_study" value={educationForm.field_of_study} onChange={onEducationChange} disabled={savingEducation} />
                </label>

                <label>
                  Orden
                  <input
                    name="display_order"
                    type="number"
                    value={educationForm.display_order}
                    onChange={onEducationChange}
                    disabled={savingEducation}
                  />
                </label>
              </div>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Años</h3>
                <p>Usa rangos claros para mantener una línea de tiempo consistente.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Año inicio
                  <input name="start_year" type="number" value={educationForm.start_year} onChange={onEducationChange} disabled={savingEducation} />
                </label>

                <label>
                  Año fin
                  <input name="end_year" type="number" value={educationForm.end_year} onChange={onEducationChange} disabled={savingEducation} />
                </label>
              </div>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Descripción y estado</h3>
                <p>Contexto adicional y visibilidad pública.</p>
              </div>

              <label>
                Descripción
                <textarea name="description" rows="4" value={educationForm.description} onChange={onEducationChange} disabled={savingEducation} />
              </label>

              <label className="toggle-row">
                <input name="is_active" type="checkbox" checked={educationForm.is_active} onChange={onEducationChange} disabled={savingEducation} />
                <span>Activo</span>
              </label>
            </section>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda la educación o cancela la edición actual.</p>
              </div>

              <div className="form-actions-inline">
                <button type="submit" className="admin-button primary" disabled={savingEducation}>
                  {savingEducation ? "Guardando..." : editingEducationId ? "Actualizar educación" : "Crear educación"}
                </button>

                {editingEducationId && (
                  <button type="button" className="admin-button ghost" onClick={onCancelEducationEdit} disabled={savingEducation}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list education-admin-list">
        {education.length === 0 ? (
          <p className="muted">No hay formación académica registrada.</p>
        ) : (
          education.map((item) => {
            const isDeleting = deletingEducationIds?.includes(item.id);

            return (
              <article className="education-admin-card admin-list-card" key={item.id}>
                <div className="education-admin-icon" aria-hidden="true">
                  🎓
                </div>
                <div className="education-admin-content">
                  <div className="admin-list-card__footer">
                    <strong>{item.degree}</strong>
                    <span className={`admin-status-pill ${item.is_active ? "is-active" : "is-inactive"}`}>
                      {item.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <p>{item.institution}</p>

                  <div className="admin-meta-row">
                    {item.field_of_study && <span className="admin-meta-chip">{item.field_of_study}</span>}
                    {(item.start_year || item.end_year) && (
                      <span className="admin-meta-chip">
                        {item.start_year || "Inicio"} {item.start_year && item.end_year ? "-" : ""} {item.end_year || "Actualidad"}
                      </span>
                    )}
                    <span className="admin-meta-chip">Orden {item.display_order}</span>
                  </div>

                  {item.description && <p className="education-admin-description">{item.description}</p>}

                  <div className="entity-actions">
                    <button
                      type="button"
                      className="admin-button secondary"
                      onClick={() => onEditEducation(item)}
                      disabled={savingEducation || isDeleting}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-button ghost"
                      onClick={() => onDeleteEducation(item.id)}
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
