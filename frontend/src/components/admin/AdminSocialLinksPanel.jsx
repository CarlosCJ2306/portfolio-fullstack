import "./AdminSocialLinksPanel.css";

export default function AdminSocialLinksPanel({
  socialLinks,
  socialLinkForm,
  savingSocialLink,
  editingSocialLinkId,
  onSocialLinkChange,
  onSocialLinkSubmit,
  onEditSocialLink,
  onDeleteSocialLink,
  onCancelSocialLinkEdit,
}) {
  return (
    <article className="admin-card admin-social-links-panel">
      <div className="section-header">
        <span className="badge">Redes</span>
        <h2>{editingSocialLinkId ? "Editar enlace social" : "Crear enlace social"}</h2>
      </div>

      <form className="admin-form" onSubmit={onSocialLinkSubmit}>
        <div className="form-row">
          <label>
            Plataforma
            <input name="platform" value={socialLinkForm.platform} onChange={onSocialLinkChange} disabled={savingSocialLink} />
          </label>

          <label>
            Orden
            <input name="display_order" type="number" value={socialLinkForm.display_order} onChange={onSocialLinkChange} disabled={savingSocialLink} />
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
      </form>

      <div className="entity-list">
        {socialLinks.length === 0 ? (
          <p className="muted">No hay enlaces sociales registrados.</p>
        ) : (
          socialLinks.map((socialLink) => (
            <article className="entity-card" key={socialLink.id}>
              <div>
                <strong>{socialLink.platform}</strong>
                <p>{socialLink.url}</p>
                <span className="entity-meta">Orden {socialLink.display_order} · {socialLink.is_active ? "Activo" : "Inactivo"}</span>
              </div>

              <div className="entity-actions">
                <button type="button" className="admin-button secondary" onClick={() => onEditSocialLink(socialLink)}>
                  Editar
                </button>
                <button type="button" className="admin-button ghost" onClick={() => onDeleteSocialLink(socialLink.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}