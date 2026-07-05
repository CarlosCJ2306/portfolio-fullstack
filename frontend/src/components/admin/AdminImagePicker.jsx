import { useCallback, useRef, useState } from "react";
import { uploadMediaAsset } from "../../services/adminApi";
import "./AdminImagePicker.css";

/**
 * Componente reutilizable para seleccionar o subir imágenes en el panel admin.
 *
 * Props:
 * - value: ID del asset actual (number | null)
 * - currentAsset: Objeto MediaAsset actual para preview (o null)
 * - assetType: "image" | "icon_svg" | "avatar"
 * - label: Etiqueta del campo
 * - disabled: Deshabilitar interacción
 * - mediaAssets: Lista completa de media assets disponibles
 * - onChange: Callback (assetId: number | null) => void
 * - onAssetUploaded: Callback (newAsset) => void — notifica al padre del nuevo asset
 */
export default function AdminImagePicker({
  value,
  currentAsset,
  assetType = "image",
  label = "Imagen",
  disabled = false,
  mediaAssets = [],
  onChange,
  onAssetUploaded,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function getCompatibleAssetTypes(type) {
    if (type === "icon" || type === "icon_svg") {
      return ["icon", "icon_svg"];
    }

    return [type];
  }

  // ---- Filtrar assets por tipo ----
  const compatibleAssetTypes = getCompatibleAssetTypes(assetType);
  const filteredAssets = mediaAssets.filter(
    (asset) => compatibleAssetTypes.includes(asset.asset_type)
  );

  // ---- Preview del asset seleccionado ----
  const selectedAsset =
    currentAsset ||
    mediaAssets.find((a) => a.id === value) ||
    null;

  function getAssetPreviewSrc(asset) {
    if (!asset) return null;
    if (asset.data_base64 && asset.mime_type) {
      return `data:${asset.mime_type};base64,${asset.data_base64}`;
    }
    return null;
  }

  function getAssetSvg(asset) {
    if (!asset) return null;
    return asset.svg_content || null;
  }

  const previewSrc = getAssetPreviewSrc(selectedAsset);
  const previewSvg = getAssetSvg(selectedAsset);
  const isPdf = selectedAsset?.mime_type === "application/pdf";

  // ---- Lectura de archivo y conversión a base64 ----
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // resultado: "data:image/png;base64,XXXX..."
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function processFile(file) {
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const isSvg = file.type === "image/svg+xml" || file.name.endsWith(".svg");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      let payload;

      if (isSvg) {
        const svgContent = await readFileAsText(file);
        payload = {
          asset_type: assetType,
          file_name: file.name,
          mime_type: "image/svg+xml",
          svg_content: svgContent,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
        };
      } else {
        const base64 = await readFileAsBase64(file);
        payload = {
          asset_type: assetType,
          file_name: file.name,
          mime_type: file.type || (isPdf ? "application/pdf" : "image/png"),
          data_base64: base64,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
        };
      }

      const newAsset = await uploadMediaAsset(payload);

      if (onAssetUploaded) {
        onAssetUploaded(newAsset);
      }

      if (onChange) {
        onChange(newAsset.id);
      }

      setModalOpen(false);
    } catch (error) {
      setUploadError(error.message || "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    processFile(file);
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    processFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleSelectAsset(assetId) {
    if (onChange) {
      onChange(assetId);
    }
    setModalOpen(false);
  }

  function handleClearAsset() {
    if (onChange) {
      onChange(null);
    }
  }

  function handleOpenModal() {
    setUploadError("");
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setDragging(false);
    setUploadError("");
  }

  const handleOverlayClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        handleCloseModal();
      }
    },
    []
  );

  return (
    <div className={`image-picker${disabled ? " image-picker--disabled" : ""}`}>
      <span className="image-picker__label">{label}</span>

      {/* Preview del asset actual */}
      <div className="image-picker__preview-row">
        <div className="image-picker__preview-box">
          {isPdf ? (
            <div className="image-picker__preview-empty">
              <span className="image-picker__preview-icon">📄</span>
              <span className="image-picker__preview-text">Documento PDF</span>
            </div>
          ) : previewSrc ? (
            <img
              src={previewSrc}
              alt={selectedAsset?.alt_text || label}
              className="image-picker__preview-img"
            />
          ) : previewSvg ? (
            <div
              className="image-picker__preview-svg"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <div className="image-picker__preview-empty">
              <span className="image-picker__preview-icon">
                {assetType === "document" ? "📄" : "🖼️"}
              </span>
              <span className="image-picker__preview-text">
                {assetType === "document" ? "Sin documento" : "Sin imagen"}
              </span>
            </div>
          )}
        </div>

        <div className="image-picker__controls">
          <button
            type="button"
            className="admin-button secondary image-picker__open-btn"
            onClick={handleOpenModal}
            disabled={disabled}
          >
            {value ? "Cambiar imagen" : "Seleccionar imagen"}
          </button>

          {value && (
            <button
              type="button"
              className="admin-button ghost image-picker__clear-btn"
              onClick={handleClearAsset}
              disabled={disabled}
            >
              Quitar
            </button>
          )}

          {value && (
            <span className="image-picker__id-badge">
              Asset #{value}
            </span>
          )}
        </div>
      </div>

      {/* Modal de galería */}
      {modalOpen && (
        <div
          className="image-picker__overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Selector de imagen"
        >
          <div className="image-picker__modal">
            <div className="image-picker__modal-header">
              <h3 className="image-picker__modal-title">
                Seleccionar imagen
              </h3>
              <button
                type="button"
                className="image-picker__modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Zona de upload drag & drop */}
            <div
              className={`image-picker__dropzone${dragging ? " image-picker__dropzone--dragging" : ""}${uploading ? " image-picker__dropzone--uploading" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={assetType === "document" ? "application/pdf" : "image/*,.svg"}
                className="image-picker__file-input"
                onChange={handleFileChange}
                disabled={uploading}
              />

              {uploading ? (
                <>
                  <span className="image-picker__upload-icon">⏳</span>
                  <p className="image-picker__upload-label">Subiendo imagen...</p>
                </>
              ) : (
                <>
                  <span className="image-picker__upload-icon">⬆️</span>
                  <p className="image-picker__upload-label">
                    Arrastra un archivo o haz clic para subir
                  </p>
                  <p className="image-picker__upload-hint">
                    {assetType === "document" ? "Archivos PDF" : "PNG, JPG, WebP o SVG"}
                  </p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="image-picker__upload-error">{uploadError}</p>
            )}

            {/* Galería de assets existentes */}
            <div className="image-picker__gallery-section">
              <p className="image-picker__gallery-label">
                {filteredAssets.length > 0
                  ? `${filteredAssets.length} imagen${filteredAssets.length !== 1 ? "es" : ""} disponible${filteredAssets.length !== 1 ? "s" : ""}`
                  : "No hay imágenes subidas aún. Sube la primera usando la zona de arriba."}
              </p>

              {filteredAssets.length > 0 && (
                <div className="image-picker__gallery">
                  {filteredAssets.map((asset) => {
                    const src = getAssetPreviewSrc(asset);
                    const svg = getAssetSvg(asset);
                    const isSelected = asset.id === value;

                    const isItemPdf = asset.mime_type === "application/pdf";

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className={`image-picker__gallery-item${isSelected ? " image-picker__gallery-item--selected" : ""}`}
                        onClick={() => handleSelectAsset(asset.id)}
                        title={asset.alt_text || asset.file_name || `Asset #${asset.id}`}
                      >
                        {isItemPdf ? (
                          <div className="image-picker__gallery-placeholder" style={{ fontSize: "2rem" }}>
                            📄
                          </div>
                        ) : src ? (
                          <img
                            src={src}
                            alt={asset.alt_text || ""}
                            className="image-picker__gallery-img"
                          />
                        ) : svg ? (
                          <div
                            className="image-picker__gallery-svg"
                            dangerouslySetInnerHTML={{ __html: svg }}
                          />
                        ) : (
                          <div className="image-picker__gallery-placeholder">
                            ?
                          </div>
                        )}

                        {isSelected && (
                          <span className="image-picker__gallery-check">✓</span>
                        )}

                        <span className="image-picker__gallery-name">
                          {asset.file_name || `#${asset.id}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
