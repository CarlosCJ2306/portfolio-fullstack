import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMediaAsset } from "../../services/adminApi";
import {
  getSafeSvgDataUrl,
  validateSafeSvgContent,
} from "../../utils/svgSecurity";
import "./AdminProjectGalleryPicker.css";

const MB = 1024 * 1024;
const GALLERY_MAX_BYTES = 5 * MB;
const GALLERY_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg";
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
const ACTIVE_UPLOAD_STATUSES = new Set(["pendiente", "leyendo", "subiendo"]);

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
    throw new Error("El archivo supera el límite de 5 MB para la galería del proyecto.");
  }

  if (
    normalizedMimeType
    && !isDubiousMimeType(normalizedMimeType)
    && !hasAllowedMimeType
  ) {
    throw new Error(
      `El tipo de archivo '${normalizedMimeType}' no es válido para la galería del proyecto.`
    );
  }

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    throw new Error(
      `La extensión '${fileExtension || "(sin extensión)"}' no es válida para la galería del proyecto.`
    );
  }

  const effectiveMimeType = hasAllowedMimeType
    ? normalizedMimeType
    : MIME_TYPE_BY_EXTENSION[fileExtension];

  if (!effectiveMimeType) {
    throw new Error(
      "No se pudo determinar un tipo de archivo válido para la galería del proyecto."
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

function createAbortLikeError() {
  return new DOMException("La carga fue cancelada.", "AbortError");
}

function createUploadItem(file, index) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
    fileName: file?.name || `archivo-${index + 1}`,
    status: "pendiente",
    progress: 0,
    message: "Pendiente de validación.",
  };
}

function getStatusLabel(status) {
  switch (status) {
    case "pendiente":
      return "Pendiente";
    case "leyendo":
      return "Leyendo";
    case "subiendo":
      return "Subiendo";
    case "completado":
      return "Completado";
    case "fallido":
      return "Fallido";
    case "cancelado":
      return "Cancelado";
    default:
      return "Pendiente";
  }
}

export default function AdminProjectGalleryPicker({
  value = [],
  mediaAssets = [],
  disabled = false,
  onChange,
  onAssetUploaded,
  sessionUploadedAssets = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadItems, setUploadItems] = useState([]);
  const fileInputRef = useRef(null);
  const activeReadersRef = useRef(new Map());
  const activeControllersRef = useRef(new Map());
  const uploadItemsRef = useRef([]);

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  const hasActiveUpload = useMemo(
    () => uploadItems.some((item) => ACTIVE_UPLOAD_STATUSES.has(item.status)),
    [uploadItems]
  );

  useEffect(() => {
    if (!hasActiveUpload) {
      return undefined;
    }

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasActiveUpload]);

  useEffect(() => () => {
    activeReadersRef.current.forEach((reader) => reader.abort());
    activeControllersRef.current.forEach((controller) => controller.abort());
  }, []);

  const filteredAssets = useMemo(
    () => mediaAssets.filter((asset) => asset.asset_type === "image"),
    [mediaAssets]
  );

  const selectedAssetIds = Array.isArray(value) ? value : [];
  const selectedAssets = selectedAssetIds
    .map(
      (assetId) =>
        filteredAssets.find((asset) => asset.id === Number(assetId)) || null
    )
    .filter(Boolean);

  function updateUploadItem(itemId, patch) {
    setUploadItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      )
    );
  }

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
    if (hasActiveUpload) {
      return;
    }

    updateSelection(selectedAssetIds.filter((currentId) => currentId !== assetId));
  }

  function moveAsset(assetId, direction) {
    if (hasActiveUpload) {
      return;
    }

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
    if (hasActiveUpload) {
      return;
    }

    const normalizedAssetId = Number(assetId);

    if (selectedAssetIds.includes(normalizedAssetId)) {
      removeAssetFromSelection(normalizedAssetId);
      return;
    }

    addAssetToSelection(normalizedAssetId);
  }

  function readFileAsBase64(file, itemId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      activeReadersRef.current.set(itemId, reader);

      reader.onloadstart = () => {
        updateUploadItem(itemId, {
          status: "leyendo",
          progress: 10,
          message: "Leyendo archivo...",
        });
      };

      reader.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const progress = Math.min(
          65,
          Math.max(10, Math.round((event.loaded / event.total) * 65))
        );

        updateUploadItem(itemId, {
          status: "leyendo",
          progress,
          message: "Leyendo archivo...",
        });
      };

      reader.onload = () => {
        activeReadersRef.current.delete(itemId);
        const result = String(reader.result || "");
        const base64 = result.split(",")[1] || "";

        if (!base64) {
          reject(new Error("No se pudo leer el archivo seleccionado."));
          return;
        }

        resolve(base64);
      };

      reader.onerror = () => {
        activeReadersRef.current.delete(itemId);
        reject(new Error("No se pudo leer el archivo seleccionado."));
      };

      reader.onabort = () => {
        activeReadersRef.current.delete(itemId);
        reject(createAbortLikeError());
      };

      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file, itemId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      activeReadersRef.current.set(itemId, reader);

      reader.onloadstart = () => {
        updateUploadItem(itemId, {
          status: "leyendo",
          progress: 10,
          message: "Leyendo archivo...",
        });
      };

      reader.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const progress = Math.min(
          65,
          Math.max(10, Math.round((event.loaded / event.total) * 65))
        );

        updateUploadItem(itemId, {
          status: "leyendo",
          progress,
          message: "Leyendo archivo...",
        });
      };

      reader.onload = () => {
        activeReadersRef.current.delete(itemId);
        resolve(String(reader.result || ""));
      };

      reader.onerror = () => {
        activeReadersRef.current.delete(itemId);
        reject(new Error("No se pudo leer el archivo seleccionado."));
      };

      reader.onabort = () => {
        activeReadersRef.current.delete(itemId);
        reject(createAbortLikeError());
      };

      reader.readAsText(file);
    });
  }

  function cancelUploadItem(itemId) {
    const currentItem = uploadItemsRef.current.find((item) => item.id === itemId);

    if (!currentItem || !ACTIVE_UPLOAD_STATUSES.has(currentItem.status)) {
      return;
    }

    const reader = activeReadersRef.current.get(itemId);
    const controller = activeControllersRef.current.get(itemId);

    if (reader) {
      reader.abort();
    }

    if (controller) {
      controller.abort();
    }

    updateUploadItem(itemId, {
      status: "cancelado",
      progress: 0,
      message: "La carga fue cancelada.",
    });
  }

  function cancelAllUploads() {
    uploadItemsRef.current.forEach((item) => {
      if (ACTIVE_UPLOAD_STATUSES.has(item.status)) {
        cancelUploadItem(item.id);
      }
    });
  }

  async function uploadSingleFile(file, validation, itemId) {
    const { effectiveMimeType, isSvg } = validation;
    let payload;

    if (isSvg) {
      payload = {
        asset_type: "image",
        file_name: file.name,
        mime_type: effectiveMimeType,
        svg_content: validateSafeSvgContent(await readFileAsText(file, itemId)),
        alt_text: file.name.replace(/\.[^.]+$/, ""),
      };
    } else {
      payload = {
        asset_type: "image",
        file_name: file.name,
        mime_type: effectiveMimeType,
        data_base64: await readFileAsBase64(file, itemId),
        alt_text: file.name.replace(/\.[^.]+$/, ""),
      };
    }

    const controller = new AbortController();
    activeControllersRef.current.set(itemId, controller);

    updateUploadItem(itemId, {
      status: "subiendo",
      progress: 80,
      message: "Subiendo archivo al servidor...",
    });

    try {
      return await uploadMediaAsset(payload, { signal: controller.signal });
    } finally {
      activeControllersRef.current.delete(itemId);
    }
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);

    if (files.length === 0) {
      return;
    }

    if (hasActiveUpload) {
      setUploadError(
        "Ya hay una carga en curso. Espera a que termine o cancélala antes de iniciar otra."
      );
      return;
    }

    setUploadError("");

    const createdItems = files.map((file, index) => createUploadItem(file, index));
    setUploadItems((currentItems) => [...createdItems, ...currentItems]);

    let nextSelectedAssetIds = [...selectedAssetIds];
    const batchErrors = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const uploadItem = createdItems[index];
      const latestItem = uploadItemsRef.current.find((item) => item.id === uploadItem.id);

      if (latestItem?.status === "cancelado") {
        continue;
      }

      let validation;

      try {
        validation = validateGalleryFileBeforeRead(file);
      } catch (error) {
        const message =
          error.message || "El archivo seleccionado no es válido para la galería.";
        updateUploadItem(uploadItem.id, {
          status: "fallido",
          progress: 0,
          message,
        });
        batchErrors.push(`${file.name}: ${message}`);
        continue;
      }

      try {
        const newAsset = await uploadSingleFile(file, validation, uploadItem.id);

        if (onAssetUploaded) {
          onAssetUploaded(newAsset);
        }

        const normalizedAssetId = Number(newAsset?.id);

        if (
          Number.isFinite(normalizedAssetId)
          && !nextSelectedAssetIds.includes(normalizedAssetId)
        ) {
          nextSelectedAssetIds = [...nextSelectedAssetIds, normalizedAssetId];
          updateSelection(nextSelectedAssetIds);
        }

        updateUploadItem(uploadItem.id, {
          status: "completado",
          progress: 100,
          message:
            "Asset guardado y agregado a la selección. Guarda el proyecto para asociarlo.",
        });
      } catch (error) {
        if (error?.name === "AbortError" || error?.isAbortError) {
          updateUploadItem(uploadItem.id, {
            status: "cancelado",
            progress: 0,
            message: "La carga fue cancelada.",
          });
          continue;
        }

        const message = error.message || "No se pudo subir la imagen.";
        updateUploadItem(uploadItem.id, {
          status: "fallido",
          progress: 0,
          message,
        });
        batchErrors.push(`${file.name}: ${message}`);
      }
    }

    if (batchErrors.length > 0) {
      setUploadError(batchErrors.join(" | "));
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

    if (!hasActiveUpload) {
      setDragging(true);
    }
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleOpenModal() {
    setUploadError("");
    setModalOpen(true);
  }

  function handleCloseModal() {
    if (hasActiveUpload) {
      const shouldCancel = window.confirm(
        "Hay cargas en curso. Si cierras ahora, se cancelarán los uploads pendientes. ¿Deseas continuar?"
      );

      if (!shouldCancel) {
        return;
      }

      cancelAllUploads();
    }

    setModalOpen(false);
    setDragging(false);
    setUploadError("");
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      handleCloseModal();
    }
  }

  return (
    <section
      className={`project-gallery-picker${disabled ? " project-gallery-picker--disabled" : ""}`}
    >
      <div className="project-gallery-picker__header">
        <div>
          <strong>Galería del proyecto</strong>
          <p className="project-gallery-picker__hint">
            Imágenes adicionales sin afectar la portada principal.
          </p>
        </div>

        <div className="project-gallery-picker__header-meta">
          <span className="project-gallery-picker__count-pill">
            {selectedAssets.length} seleccionada{selectedAssets.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="admin-button secondary"
            onClick={handleOpenModal}
            disabled={disabled}
          >
            Agregar imágenes
          </button>
        </div>
      </div>

      {selectedAssets.length === 0 ? (
        <div className="project-gallery-picker__empty">
          <span className="project-gallery-picker__empty-icon">Galería</span>
          <p>No hay imágenes adicionales seleccionadas.</p>
        </div>
      ) : (
        <div className="project-gallery-picker__list" aria-label="Imágenes adicionales seleccionadas">
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
                  <strong className="admin-file-name">{asset.file_name || `Asset #${asset.id}`}</strong>
                  <div className="project-gallery-picker__meta-pills">
                    <span className="project-gallery-picker__meta-pill">Posición {index + 1}</span>
                    <span className="project-gallery-picker__meta-pill">Asset #{asset.id}</span>
                  </div>
                </div>

                <div className="project-gallery-picker__actions">
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => moveAsset(asset.id, "up")}
                    disabled={disabled || isFirst || hasActiveUpload}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => moveAsset(asset.id, "down")}
                    disabled={disabled || isLast || hasActiveUpload}
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    className="admin-button ghost"
                    onClick={() => removeAssetFromSelection(asset.id)}
                    disabled={disabled || hasActiveUpload}
                  >
                    Retirar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sessionUploadedAssets.length > 0 && (
        <div className="project-gallery-picker__lifecycle-note" role="status">
          <strong>Assets subidos durante esta edición:</strong>{" "}
          {sessionUploadedAssets
            .map((asset) => asset.file_name || `Asset #${asset.id}`)
            .join(", ")}
          . Ya están en la biblioteca. La selección se asocia definitivamente al
          guardar el proyecto; retirarla o cancelar no elimina los assets.
        </div>
      )}

      {modalOpen && (
        <div
          className="project-gallery-picker__overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Selector de galería del proyecto"
        >
          <div className="project-gallery-picker__modal">
            <div className="project-gallery-picker__modal-header">
              <div>
                <h3>Seleccionar imágenes adicionales</h3>
                <p>Seleccionadas: {selectedAssetIds.length}</p>
              </div>

              <button
                type="button"
                className="project-gallery-picker__modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <p className="project-gallery-picker__modal-intro">
              Sube nuevas imágenes o reutiliza assets existentes de la biblioteca.
            </p>

            <div
              className={`project-gallery-picker__dropzone${dragging ? " project-gallery-picker__dropzone--dragging" : ""}${hasActiveUpload ? " project-gallery-picker__dropzone--uploading" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !hasActiveUpload && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !hasActiveUpload) {
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
                disabled={hasActiveUpload}
              />

              <span className="project-gallery-picker__dropzone-icon" aria-hidden="true">
                {hasActiveUpload ? "⏳" : "🖼️"}
              </span>
              <p>
                {hasActiveUpload
                  ? "Carga en curso. Espera a que termine o cancélala para iniciar otra."
                  : "Arrastra una o varias imágenes o haz clic para subir"}
              </p>
              <small>
                PNG, JPG, WebP o SVG hasta 5 MB. Cada archivo se valida antes de leerse,
                se sube por separado y solo los exitosos se agregan a la galería.
              </small>
            </div>

            {hasActiveUpload && (
              <div className="project-gallery-picker__upload-warning">
                <span>
                  Las cargas activas continúan dentro de este modal. Si lo cierras, se
                  cancelarán.
                </span>
                <button
                  type="button"
                  className="admin-button ghost"
                  onClick={cancelAllUploads}
                >
                  Cancelar cargas
                </button>
              </div>
            )}

            {uploadItems.length > 0 && (
              <div className="project-gallery-picker__upload-list" aria-live="polite">
                {uploadItems.map((item) => {
                  const canCancel = ACTIVE_UPLOAD_STATUSES.has(item.status);

                  return (
                    <article
                      key={item.id}
                      className={`project-gallery-picker__upload-item project-gallery-picker__upload-item--${item.status}`}
                    >
                      <div className="project-gallery-picker__upload-top">
                        <strong className="admin-file-name">{item.fileName}</strong>
                        <span className={`project-gallery-picker__status-chip project-gallery-picker__status-chip--${item.status}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="project-gallery-picker__upload-progress">
                        <span
                          className="project-gallery-picker__upload-progress-bar"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      <div className="project-gallery-picker__upload-meta">
                        <span>{item.message}</span>
                        <div className="project-gallery-picker__upload-meta-actions">
                          <span>{item.progress}%</span>
                          {canCancel && (
                            <button
                              type="button"
                              className="admin-button ghost"
                              onClick={() => cancelUploadItem(item.id)}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {uploadError && (
              <p className="project-gallery-picker__error">{uploadError}</p>
            )}

            <div className="project-gallery-picker__asset-summary">
              {filteredAssets.length > 0
                ? `${filteredAssets.length} imágenes disponibles en la biblioteca`
                : "No hay imágenes disponibles todavía."}
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
                      disabled={hasActiveUpload}
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

                      <span className="project-gallery-picker__grid-name admin-file-name">
                        {asset.file_name || `#${asset.id}`}
                      </span>
                      <span className="project-gallery-picker__grid-meta">Asset #{asset.id}</span>

                      {isSelected && (
                        <span className="project-gallery-picker__grid-check">✓</span>
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
