import AdminImagePicker from "./AdminImagePicker";
import "./AdminProfilePanel.css";

export default function AdminProfilePanel({
  profileForm,
  savingProfile,
  mediaAssets,
  onProfileChange,
  onProfileSubmit,
  onAssetUploaded,
  onAvatarAssetChange,
}) {
  return (
    <article className="admin-card admin-profile-panel">
      <div className="section-header">
        <span className="badge">Perfil</span>
        <h2>Editar perfil principal</h2>
      </div>

      <form className="admin-form" onSubmit={onProfileSubmit}>
        <label>
          Nombre completo
          <input name="full_name" value={profileForm.full_name} onChange={onProfileChange} disabled={savingProfile} />
        </label>

        <label>
          Título profesional
          <input name="professional_title" value={profileForm.professional_title} onChange={onProfileChange} disabled={savingProfile} />
        </label>

        <label>
          Resumen
          <textarea name="summary" rows="6" value={profileForm.summary} onChange={onProfileChange} disabled={savingProfile} />
        </label>

        <div className="form-row">
          <label>
            Ubicación
            <input name="location" value={profileForm.location} onChange={onProfileChange} disabled={savingProfile} />
          </label>

          <label>
            Correo
            <input name="email" type="email" value={profileForm.email} onChange={onProfileChange} disabled={savingProfile} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Teléfono
            <input name="phone" value={profileForm.phone} onChange={onProfileChange} disabled={savingProfile} />
          </label>

          <label>
            URL CV
            <input name="cv_url" value={profileForm.cv_url} onChange={onProfileChange} disabled={savingProfile} />
          </label>
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
        />

        <button type="submit" className="admin-button primary" disabled={savingProfile}>
          {savingProfile ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>
    </article>
  );
}