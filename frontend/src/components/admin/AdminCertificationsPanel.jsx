import AdminImagePicker from "./AdminImagePicker";
import "./AdminCertificationsPanel.css";

export default function AdminCertificationsPanel({
  certifications,
  certificationForm,
  savingCertification,
  editingCertificationId,
  mediaAssets,
  onCertificationChange,
  onCertificationSubmit,
  onEditCertification,
  onDeleteCertification,
  onCancelCertificationEdit,
  onAssetUploaded,
  onPdfAssetChange,
}) {
  return (
    <article className="admin-card admin-certifications-panel">
      <div className="section-header">
        <span className="badge">Certificaciones</span>
        <h2>{editingCertificationId ? "Editar certificación" : "Crear certificación"}</h2>
      </div>

      <form className="admin-form" onSubmit={onCertificationSubmit}>
        <label>
          Nombre
          <input name="name" value={certificationForm.name} onChange={onCertificationChange} disabled={savingCertification} />
        </label>

        <div className="form-row">
          <label>
            Emisor
            <input name="issuer" value={certificationForm.issuer} onChange={onCertificationChange} disabled={savingCertification} />
          </label>

          <label>
            Fecha
            <input name="issue_date" type="date" value={certificationForm.issue_date} onChange={onCertificationChange} disabled={savingCertification} />
          </label>
        </div>

        <label>
          URL de credencial
          <input name="credential_url" value={certificationForm.credential_url} onChange={onCertificationChange} disabled={savingCertification} />
        </label>

        {/* Selector de PDF del certificado */}
        <AdminImagePicker
          value={certificationForm.certificate_file_id || null}
          currentAsset={
            certificationForm.certificate_file_id
              ? mediaAssets?.find((a) => a.id === Number(certificationForm.certificate_file_id)) ?? null
              : null
          }
          assetType="document"
          label="Archivo del certificado (PDF)"
          disabled={savingCertification}
          mediaAssets={mediaAssets || []}
          onChange={onPdfAssetChange}
          onAssetUploaded={onAssetUploaded}
        />

        <label>
          Descripción
          <textarea name="description" rows="4" value={certificationForm.description} onChange={onCertificationChange} disabled={savingCertification} />
        </label>

        <div className="form-row">
          <label>
            Orden
            <input name="display_order" type="number" value={certificationForm.display_order} onChange={onCertificationChange} disabled={savingCertification} />
          </label>

          <label className="toggle-row">
            <input name="is_active" type="checkbox" checked={certificationForm.is_active} onChange={onCertificationChange} disabled={savingCertification} />
            <span>Activo</span>
          </label>
        </div>

        <div className="form-actions-inline">
          <button type="submit" className="admin-button primary" disabled={savingCertification}>
            {savingCertification ? "Guardando..." : editingCertificationId ? "Actualizar certificación" : "Crear certificación"}
          </button>

          {editingCertificationId && (
            <button type="button" className="admin-button ghost" onClick={onCancelCertificationEdit} disabled={savingCertification}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="entity-list certification-admin-list">
        {certifications.length === 0 ? (
          <p className="muted">No hay certificaciones registradas.</p>
        ) : (
          certifications.map((certification) => (
            <article className="certification-admin-card" key={certification.id}>
              <div className="certification-admin-icon">✓</div>
              <div className="certification-admin-content">
                <strong>{certification.name}</strong>
                <p>{certification.issuer}</p>

                {certification.issue_date && (
                  <span className="certification-admin-date">{certification.issue_date}</span>
                )}

                {certification.description && (
                  <p className="certification-admin-description">{certification.description}</p>
                )}

                {certification.credential_url && (
                  <a href={certification.credential_url} target="_blank" rel="noreferrer" className="certification-admin-link">
                    Ver credencial
                  </a>
                )}

                <div className="entity-meta">Orden {certification.display_order}</div>

                <div className="entity-actions">
                  <button type="button" className="admin-button secondary" onClick={() => onEditCertification(certification)}>
                    Editar
                  </button>
                  <button type="button" className="admin-button ghost" onClick={() => onDeleteCertification(certification.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}