import AdminImagePicker from "./AdminImagePicker";
import "./AdminProfilePanel.css";

export default function AdminProfilePanel({
  profileForm,
  savingProfile,
  mediaAssets,
  validationErrors,
  onProfileChange,
  onProfileSubmit,
  onAssetUploaded,
  sessionUploadedAssets,
  onAvatarAssetChange,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-profile-panel">
      <div className="section-header">
        <span className="badge">Perfil</span>
        <h2>Editar perfil principal</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando perfil...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form className="admin-form" onSubmit={onProfileSubmit}>
        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3>Identidad pública</h3>
            <p>Nombre, título y resumen principal del portfolio.</p>
          </div>

          <div className="admin-form-section__stack">
            <label>
              Nombre completo
              <input name="full_name" value={profileForm.full_name} onChange={onProfileChange} disabled={savingProfile} />
            </label>

            <label>
              Título profesional
              <input
                name="professional_title"
                value={profileForm.professional_title}
                onChange={onProfileChange}
                disabled={savingProfile}
              />
            </label>

            <label>
              Resumen
              <textarea name="summary" rows="6" value={profileForm.summary} onChange={onProfileChange} disabled={savingProfile} />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3>Contacto</h3>
            <p>Datos visibles y enlaces de contacto del perfil.</p>
          </div>

          <div className="admin-form-section__grid">
            <label>
              Ubicación
              <input name="location" value={profileForm.location} onChange={onProfileChange} disabled={savingProfile} />
            </label>

            <label>
              Correo
              <input name="email" type="email" value={profileForm.email} onChange={onProfileChange} disabled={savingProfile} />
            </label>

            <label>
              Teléfono
              <input name="phone" value={profileForm.phone} onChange={onProfileChange} disabled={savingProfile} />
            </label>

            <label>
              URL CV
              <input name="cv_url" value={profileForm.cv_url} onChange={onProfileChange} disabled={savingProfile} />
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section__header">
            <h3>Avatar y CV</h3>
            <p>La imagen se conserva aunque edites solo texto, siempre que no la reemplaces.</p>
          </div>

          <AdminImagePicker
            value={profileForm.avatar_asset_id || null}
            currentAsset={
              profileForm.avatar_asset_id
                ? mediaAssets?.find((a) => a.id === Number(profileForm.avatar_asset_id)) ?? null
                : null
            }
            assetType="avatar"
            label="Avatar / Foto de perfil"
            disabled={savingProfile}
            mediaAssets={mediaAssets || []}
            onChange={onAvatarAssetChange}
            onAssetUploaded={onAssetUploaded}
            sessionUploadedAssets={sessionUploadedAssets}
          />
        </section>

        <section className="admin-form-section admin-form-footer">
          <div className="admin-form-section__header">
            <h3>Guardado</h3>
            <p>Revisa los cambios antes de actualizar la información pública.</p>
          </div>

          <p className="admin-form-footer__hint">El avatar actual se mantiene si no seleccionas uno diferente.</p>

          <button type="submit" className="admin-button primary" disabled={savingProfile}>
            {savingProfile ? "Guardando..." : "Guardar perfil"}
          </button>
        </section>
      </form>
    </article>
  );
}
