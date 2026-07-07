import "./AdminSocialLinksPanel.css";

export default function AdminSocialLinksPanel({
  socialLinks,
  socialLinkForm,
  savingSocialLink,
  deletingSocialLinkIds,
  editingSocialLinkId,
  validationErrors,
  onSocialLinkChange,
  onSocialLinkSubmit,
  onEditSocialLink,
  onDeleteSocialLink,
  onCancelSocialLinkEdit,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-social-links-panel">
      <div className="section-header">
        <span className="badge">Redes</span>
        <h2>Enlaces sociales</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando enlaces...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="admin-collapsible" open={editingSocialLinkId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">
              {editingSocialLinkId ? "Editar enlace social" : "Crear nuevo enlace"}
            </span>
            <p className="admin-collapsible__meta">
              En móvil se mantiene colapsado para reducir saturación cuando solo quieres revisar la lista.
            </p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onSocialLinkSubmit}>
            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Datos del enlace</h3>
                <p>Plataforma, URL y nombre del icono visible.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Plataforma
                  <input name="platform" value={socialLinkForm.platform} onChange={onSocialLinkChange} disabled={savingSocialLink} />
                </label>

                <label>
                  Orden
                  <input
                    name="display_order"
                    type="number"
                    value={socialLinkForm.display_order}
                    onChange={onSocialLinkChange}
                    disabled={savingSocialLink}
                  />
                </label>
              </div>

              <label>
                URL
                <input name="url" value={socialLinkForm.url} onChange={onSocialLinkChange} disabled={savingSocialLink} />
              </label>

              <label>
                Nombre del icono
                <input name="icon_name" value={socialLinkForm.icon_name} onChange={onSocialLinkChange} disabled={savingSocialLink} />
              </label>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Visibilidad</h3>
                <p>Define si el enlace aparece públicamente.</p>
              </div>

              <label className="toggle-row">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={socialLinkForm.is_active}
                  onChange={onSocialLinkChange}
                  disabled={savingSocialLink}
                />
                <span>Activo</span>
              </label>
            </section>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda el enlace o cancela la edición actual.</p>
              </div>

              <div className="form-actions-inline">
                <button type="submit" className="admin-button primary" disabled={savingSocialLink}>
                  {savingSocialLink ? "Guardando..." : editingSocialLinkId ? "Actualizar enlace" : "Crear enlace"}
                </button>

                {editingSocialLinkId && (
                  <button type="button" className="admin-button ghost" onClick={onCancelSocialLinkEdit} disabled={savingSocialLink}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list">
        {socialLinks.length === 0 ? (
          <p className="muted">No hay enlaces sociales registrados.</p>
        ) : (
          socialLinks.map((socialLink) => {
            const isDeleting = deletingSocialLinkIds?.includes(socialLink.id);

            return (
              <article className="entity-card admin-list-card" key={socialLink.id}>
                <div className="admin-stack">
                  <div className="admin-list-card__footer">
                    <strong>{socialLink.platform}</strong>
                    <span className={`admin-status-pill ${socialLink.is_active ? "is-active" : "is-inactive"}`}>
                      {socialLink.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <a href={socialLink.url} target="_blank" rel="noreferrer" className="admin-card-link admin-url">
                    {socialLink.url}
                  </a>

                  <div className="admin-meta-row">
                    <span className="admin-meta-chip">Orden {socialLink.display_order}</span>
                    {socialLink.icon_name && <span className="admin-meta-chip">Icono: {socialLink.icon_name}</span>}
                  </div>
                </div>

                <div className="entity-actions">
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => onEditSocialLink(socialLink)}
                    disabled={savingSocialLink || isDeleting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => onDeleteSocialLink(socialLink.id)}
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
