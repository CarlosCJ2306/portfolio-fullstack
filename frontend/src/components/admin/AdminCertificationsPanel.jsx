import AdminImagePicker from "./AdminImagePicker";
import "./AdminCertificationsPanel.css";

export default function AdminCertificationsPanel({
  certifications,
  certificationForm,
  suggestedDisplayOrder,
  formRef,
  firstFieldRef,
  savingCertification,
  deletingCertificationIds,
  editingCertificationId,
  mediaAssets,
  validationErrors,
  onCertificationChange,
  onCertificationSubmit,
  onEditCertification,
  onDeleteCertification,
  onCancelCertificationEdit,
  onAssetUploaded,
  sessionUploadedAssets,
  onPdfAssetChange,
  panelError,
  panelLoading,
  onRetry,
}) {
  const validationMessages = Object.values(validationErrors || {});

  return (
    <article className="admin-card admin-certifications-panel">
      <div className="section-header">
        <span className="badge">Certificaciones</span>
        <h2>Certificaciones y documentos</h2>
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

      {!panelError && panelLoading && <p className="muted">Actualizando certificaciones...</p>}

      {validationMessages.length > 0 && (
        <div className="admin-message error">
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <details ref={formRef} className="admin-collapsible" open={editingCertificationId ? true : undefined}>
        <summary className="admin-collapsible__summary">
          <div className="admin-collapsible__summary-copy">
            <span className="admin-collapsible__eyebrow">Formulario</span>
            <span className="admin-collapsible__title">
              {editingCertificationId ? "Editar certificación" : "Crear nueva certificación"}
            </span>
            <p className="admin-collapsible__meta">Separa datos principales, URL y PDF para que el flujo sea más claro en móvil.</p>
          </div>
          <span className="admin-collapsible__icon" aria-hidden="true">
            v
          </span>
        </summary>

        <div className="admin-collapsible__body">
          <form className="admin-form" onSubmit={onCertificationSubmit}>
            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Datos principales</h3>
                <p>Nombre, emisor, fecha y descripción general.</p>
              </div>

              <label>
                Nombre
                <input ref={firstFieldRef} name="name" value={certificationForm.name} onChange={onCertificationChange} disabled={savingCertification} />
              </label>

              <div className="admin-form-section__grid">
                <label>
                  Emisor
                  <input name="issuer" value={certificationForm.issuer} onChange={onCertificationChange} disabled={savingCertification} />
                </label>

                <label>
                  Fecha
                  <input
                    name="issue_date"
                    type="date"
                    value={certificationForm.issue_date}
                    onChange={onCertificationChange}
                    disabled={savingCertification}
                  />
                </label>

                <label>
                  Fecha de vencimiento
                  <input
                    name="expiration_date"
                    type="date"
                    value={certificationForm.expiration_date}
                    onChange={onCertificationChange}
                    disabled={savingCertification}
                  />
                  <span className="certification-admin-hint">
                    Déjala vacía si la certificación no vence.
                  </span>
                </label>
              </div>

              <label>
                Descripción
                <textarea name="description" rows="4" value={certificationForm.description} onChange={onCertificationChange} disabled={savingCertification} />
              </label>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Credential URL</h3>
                <p>Enlace externo independiente del documento PDF.</p>
              </div>

              <label>
                URL de credencial
                <input name="credential_url" value={certificationForm.credential_url} onChange={onCertificationChange} disabled={savingCertification} />
              </label>
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>PDF / Documento</h3>
                <p>Asocia el archivo del certificado sin mezclarlo con la URL de credencial.</p>
              </div>

              <AdminImagePicker
                value={certificationForm.certificate_file_id || null}
                currentAsset={
                  certificationForm.certificate_file_id
                    ? mediaAssets?.find((asset) => asset.id === Number(certificationForm.certificate_file_id)) ?? null
                    : null
                }
                assetType="document"
                label="Archivo del certificado (PDF)"
                disabled={savingCertification}
                mediaAssets={mediaAssets || []}
                onChange={onPdfAssetChange}
                onAssetUploaded={onAssetUploaded}
                sessionUploadedAssets={sessionUploadedAssets}
              />
            </section>

            <section className="admin-form-section">
              <div className="admin-form-section__header">
                <h3>Estado y orden</h3>
                <p>Controla visibilidad y prioridad de visualización.</p>
              </div>

              <div className="admin-form-section__grid">
                <label>
                  Orden
                  <input
                    name="display_order"
                    type="number"
                    value={certificationForm.display_order}
                    onChange={onCertificationChange}
                    disabled={savingCertification}
                  />
                  {!editingCertificationId && (
                    <span className="muted">
                      Déjalo vacío para asignar automáticamente el siguiente orden. Sugerido: {suggestedDisplayOrder}.
                    </span>
                  )}
                </label>

                <label className="toggle-row">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={certificationForm.is_active}
                    onChange={onCertificationChange}
                    disabled={savingCertification}
                  />
                  <span>Activo</span>
                </label>
              </div>
            </section>

            <section className="admin-form-section admin-form-footer">
              <div className="admin-form-section__header">
                <h3>Acciones</h3>
                <p>Guarda la certificación o cancela la edición actual.</p>
              </div>

              <div className="form-actions-inline">
                <button type="submit" className="admin-button primary" disabled={savingCertification}>
                  {savingCertification ? "Guardando..." : editingCertificationId ? "Actualizar certificación" : "Crear certificación"}
                </button>

                {editingCertificationId && (
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={onCancelCertificationEdit}
                    disabled={savingCertification}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </section>
          </form>
        </div>
      </details>

      <div className="entity-list certification-admin-list">
        {certifications.length === 0 ? (
          <p className="muted">No hay certificaciones registradas.</p>
        ) : (
          certifications.map((certification) => {
            const isDeleting = deletingCertificationIds?.includes(certification.id);

            return (
              <article className="certification-admin-card admin-list-card" key={certification.id}>
                <div className="certification-admin-icon" aria-hidden="true">
                  ✓
                </div>
                <div className="certification-admin-content">
                  <div className="admin-list-card__footer">
                    <strong>{certification.name}</strong>
                    <span className={`admin-status-pill ${certification.is_active ? "is-active" : "is-inactive"}`}>
                      {certification.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <p>{certification.issuer}</p>

                  <div className="admin-meta-row">
                    {certification.issue_date && <span className="admin-meta-chip">Expedición: {certification.issue_date}</span>}
                    {certification.expiration_date ? (
                      <span className="admin-meta-chip">Vence: {certification.expiration_date}</span>
                    ) : (
                      <span className="admin-meta-chip is-muted">Sin vencimiento registrado</span>
                    )}
                    <span className="admin-meta-chip">Orden {certification.display_order}</span>
                    {certification.certificate_file_id && <span className="admin-meta-chip">PDF asociado</span>}
                  </div>

                  {certification.description && <p className="certification-admin-description">{certification.description}</p>}

                  {certification.credential_url && (
                    <a href={certification.credential_url} target="_blank" rel="noreferrer" className="admin-card-link certification-admin-link">
                      Ver credencial
                    </a>
                  )}

                  <div className="entity-actions">
                    <button
                      type="button"
                      className="admin-button secondary"
                      onClick={() => onEditCertification(certification)}
                      disabled={savingCertification || isDeleting}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-button ghost"
                      onClick={() => onDeleteCertification(certification.id)}
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
