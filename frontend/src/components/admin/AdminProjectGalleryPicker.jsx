import { useCallback, useMemo, useRef, useState } from "react";
import { uploadMediaAsset } from "../../services/adminApi";
import {
  getSafeSvgDataUrl,
  validateSafeSvgContent,
} from "../../utils/svgSecurity";
import "./AdminProjectGalleryPicker.css";

const MB = 1024 * 1024;
const GALLERY_MAX_BYTES = 5 * MB;
const GALLERY_ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg";
const GALLERY_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
const GALLERY_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
];
const MIME_TYPE_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function isDubiousMimeType(mimeType) {
  return !mimeType || mimeType === "application/octet-stream";
}

function validateGalleryFileBeforeRead(file) {
  const normalizedMimeType = (file.type || "").toLowerCase();
  const fileExtension = getFileExtension(file.name || "");
  const hasAllowedMimeType = GALLERY_ALLOWED_MIME_TYPES.includes(normalizedMimeType);
  const hasAllowedExtension = GALLERY_ALLOWED_EXTENSIONS.includes(fileExtension);

  if (file.size > GALLERY_MAX_BYTES) {
    throw new Error("El archivo supera el limite de 5 MB para la galeria del proyecto.");
  }

  if (
    normalizedMimeType &&
    !isDubiousMimeType(normalizedMimeType) &&
    !hasAllowedMimeType
  ) {
    throw new Error(
      `El tipo de archivo '${normalizedMimeType}' no es valido para la galeria del proyecto.`
    );
  }

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    throw new Error(
      `La extension '${fileExtension || "(sin extension)"}' no es valida para la galeria del proyecto.`
    );
  }

  const effectiveMimeType =
    hasAllowedMimeType
      ? normalizedMimeType
      : MIME_TYPE_BY_EXTENSION[fileExtension];

  if (!effectiveMimeType) {
    throw new Error(
      "No se pudo determinar un tipo de archivo valido para la galeria del proyecto."
    );
  }

  return {
    effectiveMimeType,
    isSvg: effectiveMimeType === "image/svg+xml",
  };
}

function getAssetPreviewSrc(asset) {
  if (!asset?.data_base64 || !asset?.mime_type) {
    return null;
  }

  return `data:${asset.mime_type};base64,${asset.data_base64}`;
}

export default function AdminProjectGalleryPicker({
  value = [],
  mediaAssets = [],
  disabled = false,
  onChange,
  onAssetUploaded,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const filteredAssets = useMemo(
    () => mediaAssets.filter((asset) => asset.asset_type === "image"),
    [mediaAssets]
  );

  const selectedAssetIds = Array.isArray(value) ? value : [];
  const selectedAssets = selectedAssetIds
    .map((assetId) => filteredAssets.find((asset) => asset.id === Number(assetId)) || null)
    .filter(Boolean);

  function updateSelection(nextIds) {
    if (onChange) {
      onChange(nextIds);
    }
  }

  function addAssetToSelection(assetId) {
    const normalizedAssetId = Number(assetId);

    if (!Number.isFinite(normalizedAssetId)) {
      return;
    }

    if (selectedAssetIds.includes(normalizedAssetId)) {
      return;
    }

    updateSelection([...selectedAssetIds, normalizedAssetId]);
  }

  function removeAssetFromSelection(assetId) {
    updateSelection(selectedAssetIds.filter((currentId) => currentId !== assetId));
  }

  function moveAsset(assetId, direction) {
    const currentIndex = selectedAssetIds.indexOf(assetId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= selectedAssetIds.length) {
      return;
    }

    const nextIds = [...selectedAssetIds];
    const [movedId] = nextIds.splice(currentIndex, 1);
    nextIds.splice(targetIndex, 0, movedId);
    updateSelection(nextIds);
  }

  function toggleAssetSelection(assetId) {
    const normalizedAssetId = Number(assetId);

    if (selectedAssetIds.includes(normalizedAssetId)) {
      removeAssetFromSelection(normalizedAssetId);
      return;
    }

    addAssetToSelection(normalizedAssetId);
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function uploadSingleFile(file, validation) {
    const { effectiveMimeType, isSvg } = validation;
    let payload;

    if (isSvg) {
      payload = {
        asset_type: "image",
        file_name: file.name,
        mime_type: effectiveMimeType,
        svg_content: validateSafeSvgContent(await readFileAsText(file)),
        alt_text: file.name.replace(/\.[^.]+$/, ""),
      };
    } else {
      payload = {
        asset_type: "image",
        file_name: file.name,
        mime_type: effectiveMimeType,
        data_base64: await readFileAsBase64(file),
        alt_text: file.name.replace(/\.[^.]+$/, ""),
      };
    }

    return uploadMediaAsset(payload);
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadingCount(files.length);
    setUploadError("");

    let nextSelectedAssetIds = [...selectedAssetIds];
    const uploadErrors = [];

    try {
      for (const file of files) {
        try {
          const validation = validateGalleryFileBeforeRead(file);
          const newAsset = await uploadSingleFile(file, validation);

          if (onAssetUploaded) {
            onAssetUploaded(newAsset);
          }

          const normalizedAssetId = Number(newAsset?.id);

          if (
            Number.isFinite(normalizedAssetId) &&
            !nextSelectedAssetIds.includes(normalizedAssetId)
          ) {
            nextSelectedAssetIds = [...nextSelectedAssetIds, normalizedAssetId];
            updateSelection(nextSelectedAssetIds);
          }
        } catch (error) {
          uploadErrors.push(
            `${file.name}: ${error.message || "No se pudo subir la imagen."}`
          );
        }
      }

      if (uploadErrors.length > 0) {
        setUploadError(uploadErrors.join(" | "));
      }
    } finally {
      setUploading(false);
      setUploadingCount(0);
    }
  }

  function handleFileChange(event) {
    void processFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    void processFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
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

  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      handleCloseModal();
    }
  }, []);

  return (
    <section className={`project-gallery-picker${disabled ? " project-gallery-picker--disabled" : ""}`}>
      <div className="project-gallery-picker__header">
        <div>
          <strong>Galeria del proyecto</strong>
          <p className="project-gallery-picker__hint">
            Agrega imagenes adicionales sin afectar la portada principal.
          </p>
        </div>

        <button
          type="button"
          className="admin-button secondary"
          onClick={handleOpenModal}
          disabled={disabled}
        >
          Agregar imagenes
        </button>
      </div>

      {selectedAssets.length === 0 ? (
        <div className="project-gallery-picker__empty">
          <span className="project-gallery-picker__empty-icon">Imagen</span>
          <p>No hay imagenes adicionales seleccionadas.</p>
        </div>
      ) : (
        <div className="project-gallery-picker__list">
          {selectedAssets.map((asset, index) => {
            const previewSrc = getAssetPreviewSrc(asset);
            const safeSvgSrc = getSafeSvgDataUrl(asset.svg_content);
            const isFirst = index === 0;
            const isLast = index === selectedAssets.length - 1;

            return (
              <article className="project-gallery-picker__item" key={asset.id}>
                <div className="project-gallery-picker__thumb">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={asset.alt_text || asset.file_name || `Asset ${asset.id}`}
                      className="project-gallery-picker__thumb-img"
                    />
                  ) : safeSvgSrc ? (
                    <img
                      src={safeSvgSrc}
                      alt={asset.alt_text || asset.file_name || `Asset ${asset.id}`}
                      className="project-gallery-picker__thumb-img"
                    />
                  ) : (
                    <div className="project-gallery-picker__thumb-placeholder">?</div>
                  )}
                </div>

                <div className="project-gallery-picker__meta">
                  <strong>{asset.file_name || `Asset #${asset.id}`}</strong>
                  <span>Posicion {index + 1}</span>
                  <span>Asset #{asset.id}</span>
                </div>

                <div className="project-gallery-picker__actions">
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => moveAsset(asset.id, "up")}
                    disabled={disabled || isFirst}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => moveAsset(asset.id, "down")}
                    disabled={disabled || isLast}
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => removeAssetFromSelection(asset.id)}
                    disabled={disabled}
                  >
                    Retirar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="project-gallery-picker__overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Selector de galeria del proyecto"
        >
          <div className="project-gallery-picker__modal">
            <div className="project-gallery-picker__modal-header">
              <div>
                <h3>Seleccionar imagenes adicionales</h3>
                <p>Seleccionadas: {selectedAssetIds.length}</p>
              </div>

              <button
                type="button"
                className="project-gallery-picker__modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                X
              </button>
            </div>

            <div
              className={`project-gallery-picker__dropzone${dragging ? " project-gallery-picker__dropzone--dragging" : ""}${uploading ? " project-gallery-picker__dropzone--uploading" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={GALLERY_ACCEPT_ATTR}
                className="project-gallery-picker__file-input"
                onChange={handleFileChange}
                disabled={uploading}
              />

              <span className="project-gallery-picker__dropzone-icon">
                {uploading ? "Subiendo" : "Subir"}
              </span>
              <p>
                {uploading
                  ? `Subiendo ${uploadingCount} imagen${uploadingCount === 1 ? "" : "es"}...`
                  : "Arrastra una o varias imagenes o haz clic para subir"}
              </p>
              <small>PNG, JPG, WebP o SVG hasta 5 MB. Cada archivo se sube por separado, queda disponible globalmente y se agrega a esta galeria.</small>
            </div>

            {uploadError && (
              <p className="project-gallery-picker__error">{uploadError}</p>
            )}

            <div className="project-gallery-picker__asset-summary">
              {filteredAssets.length > 0
                ? `${filteredAssets.length} imagenes disponibles en la biblioteca`
                : "No hay imagenes disponibles todavia."}
            </div>

            {filteredAssets.length > 0 && (
              <div className="project-gallery-picker__grid">
                {filteredAssets.map((asset) => {
                  const previewSrc = getAssetPreviewSrc(asset);
                  const safeSvgSrc = getSafeSvgDataUrl(asset.svg_content);
                  const isSelected = selectedAssetIds.includes(asset.id);

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className={`project-gallery-picker__grid-item${isSelected ? " project-gallery-picker__grid-item--selected" : ""}`}
                      onClick={() => toggleAssetSelection(asset.id)}
                      title={asset.alt_text || asset.file_name || `Asset #${asset.id}`}
                    >
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={asset.alt_text || ""}
                          className="project-gallery-picker__grid-img"
                        />
                      ) : safeSvgSrc ? (
                        <img
                          src={safeSvgSrc}
                          alt={asset.alt_text || asset.file_name || ""}
                          className="project-gallery-picker__grid-img"
                        />
                      ) : (
                        <div className="project-gallery-picker__grid-placeholder">?</div>
                      )}

                      <span className="project-gallery-picker__grid-name">
                        {asset.file_name || `#${asset.id}`}
                      </span>

                      {isSelected && (
                        <span className="project-gallery-picker__grid-check">OK</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="project-gallery-picker__modal-actions">
              <button
                type="button"
                className="admin-button primary"
                onClick={handleCloseModal}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
