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
        <h2>{editingEducationId ? "Editar educación" : "Crear educación"}</h2>
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

      <form className="admin-form" onSubmit={onEducationSubmit}>
        <div className="form-row">
          <label>
            Institución
            <input name="institution" value={educationForm.institution} onChange={onEducationChange} disabled={savingEducation} />
          </label>

          <label>
            Título
            <input name="degree" value={educationForm.degree} onChange={onEducationChange} disabled={savingEducation} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Área
            <input name="field_of_study" value={educationForm.field_of_study} onChange={onEducationChange} disabled={savingEducation} />
          </label>

          <label>
            Orden
            <input name="display_order" type="number" value={educationForm.display_order} onChange={onEducationChange} disabled={savingEducation} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Año inicio
            <input name="start_year" type="number" value={educationForm.start_year} onChange={onEducationChange} disabled={savingEducation} />
          </label>

          <label>
            Año fin
            <input name="end_year" type="number" value={educationForm.end_year} onChange={onEducationChange} disabled={savingEducation} />
          </label>
        </div>

        <label>
          Descripción
          <textarea name="description" rows="4" value={educationForm.description} onChange={onEducationChange} disabled={savingEducation} />
        </label>

        <label className="toggle-row">
          <input name="is_active" type="checkbox" checked={educationForm.is_active} onChange={onEducationChange} disabled={savingEducation} />
          <span>Activo</span>
        </label>

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
      </form>

      <div className="entity-list education-admin-list">
        {education.length === 0 ? (
          <p className="muted">No hay formación académica registrada.</p>
        ) : (
          education.map((item) => {
            const isDeleting = deletingEducationIds?.includes(item.id);

            return (
              <article className="education-admin-card" key={item.id}>
                <div className="education-admin-icon">🎓</div>
                <div className="education-admin-content">
                  <strong>{item.degree}</strong>
                  <p>{item.institution}</p>

                  {item.field_of_study && <span className="education-admin-field">{item.field_of_study}</span>}

                  {(item.start_year || item.end_year) && (
                    <span className="education-admin-date">
                      {item.start_year || ""} {item.start_year && item.end_year ? "—" : ""} {item.end_year || ""}
                    </span>
                  )}

                  {item.description && <p className="education-admin-description">{item.description}</p>}

                  <div className="entity-meta">Orden {item.display_order}</div>

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
