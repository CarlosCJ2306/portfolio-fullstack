import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMediaAsset } from "../../services/adminApi";
import {
  getSafeSvgDataUrl,
  validateSafeSvgContent,
} from "../../utils/svgSecurity";
import "./AdminImagePicker.css";

const MB = 1024 * 1024;
const ACTIVE_UPLOAD_STATUSES = new Set(["pendiente", "leyendo", "subiendo"]);

const UPLOAD_RULES_BY_ASSET_TYPE = {
  avatar: {
    label: "el avatar",
    maxBytes: 2 * MB,
    acceptAttr:
      "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
  },
  image: {
    label: "la imagen",
    maxBytes: 5 * MB,
    acceptAttr:
      "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
  },
  icon: {
    label: "el icono",
    maxBytes: 5 * MB,
    acceptAttr:
      "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
  },
  icon_svg: {
    label: "el icono",
    maxBytes: 5 * MB,
    acceptAttr:
      "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg",
    acceptedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
  },
  document: {
    label: "el documento PDF",
    maxBytes: 10 * MB,
    acceptAttr: "application/pdf,.pdf",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
  },
};

const MIME_TYPE_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
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

function formatMaxSize(maxBytes) {
  const sizeInMb = maxBytes / MB;

  return Number.isInteger(sizeInMb)
    ? `${sizeInMb} MB`
    : `${sizeInMb.toFixed(1)} MB`;
}

function getUploadRules(assetType) {
  return UPLOAD_RULES_BY_ASSET_TYPE[assetType] || UPLOAD_RULES_BY_ASSET_TYPE.image;
}

function validateFileBeforeRead(file, assetType) {
  const rules = getUploadRules(assetType);
  const normalizedMimeType = (file.type || "").toLowerCase();
  const fileExtension = getFileExtension(file.name || "");
  const hasAllowedMimeType = rules.acceptedMimeTypes.includes(normalizedMimeType);
  const hasAllowedExtension = rules.acceptedExtensions.includes(fileExtension);

  if (file.size > rules.maxBytes) {
    throw new Error(
      `El archivo supera el limite de ${formatMaxSize(rules.maxBytes)} para ${rules.label}.`
    );
  }

  if (
    normalizedMimeType
    && !isDubiousMimeType(normalizedMimeType)
    && !hasAllowedMimeType
  ) {
    throw new Error(
      `El tipo de archivo '${normalizedMimeType}' no es valido para ${rules.label}.`
    );
  }

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    throw new Error(
      `La extension '${fileExtension || "(sin extension)"}' no es valida para ${rules.label}.`
    );
  }

  const effectiveMimeType = hasAllowedMimeType
    ? normalizedMimeType
    : MIME_TYPE_BY_EXTENSION[fileExtension];

  if (!effectiveMimeType) {
    throw new Error(
      `No se pudo determinar un tipo de archivo valido para ${rules.label}.`
    );
  }

  return {
    effectiveMimeType,
    isSvg: effectiveMimeType === "image/svg+xml",
  };
}

function createUploadItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName: file?.name || "archivo",
    status: "pendiente",
    progress: 0,
    message: "Pendiente de validacion.",
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

function createAbortLikeError() {
  return new DOMException("La carga fue cancelada.", "AbortError");
}

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
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadItems, setUploadItems] = useState([]);
  const fileInputRef = useRef(null);
  const readerRef = useRef(null);
  const abortControllerRef = useRef(null);
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
    if (readerRef.current) {
      readerRef.current.abort();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  function getCompatibleAssetTypes(type) {
    if (type === "icon" || type === "icon_svg") {
      return ["icon", "icon_svg"];
    }

    return [type];
  }

  const compatibleAssetTypes = getCompatibleAssetTypes(assetType);
  const filteredAssets = mediaAssets.filter((asset) =>
    compatibleAssetTypes.includes(asset.asset_type)
  );

  const selectedAsset =
    currentAsset || mediaAssets.find((asset) => asset.id === value) || null;

  function updateUploadItem(itemId, patch) {
    setUploadItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      )
    );
  }

  function getAssetPreviewSrc(asset) {
    if (!asset) {
      return null;
    }

    if (asset.data_base64 && asset.mime_type) {
      return `data:${asset.mime_type};base64,${asset.data_base64}`;
    }

    return null;
  }

  const previewSrc = getAssetPreviewSrc(selectedAsset);
  const previewSvgSrc = getSafeSvgDataUrl(selectedAsset?.svg_content);
  const isPdf = selectedAsset?.mime_type === "application/pdf";

  function readFileAsBase64(file, itemId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      readerRef.current = reader;

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
        readerRef.current = null;

        try {
          const result = String(reader.result || "");
          const base64 = result.split(",")[1];

          if (!base64) {
            reject(new Error("No se pudo leer el archivo seleccionado."));
            return;
          }

          resolve(base64);
        } catch {
          reject(new Error("No se pudo procesar el archivo seleccionado."));
        }
      };

      reader.onerror = () => {
        readerRef.current = null;
        reject(new Error("No se pudo leer el archivo seleccionado."));
      };

      reader.onabort = () => {
        readerRef.current = null;
        reject(createAbortLikeError());
      };

      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file, itemId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      readerRef.current = reader;

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
        readerRef.current = null;
        resolve(String(reader.result || ""));
      };

      reader.onerror = () => {
        readerRef.current = null;
        reject(new Error("No se pudo leer el archivo seleccionado."));
      };

      reader.onabort = () => {
        readerRef.current = null;
        reject(createAbortLikeError());
      };

      reader.readAsText(file);
    });
  }

  function cancelActiveUpload() {
    if (readerRef.current) {
      readerRef.current.abort();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  async function processFile(file) {
    if (!file) {
      return;
    }

    if (hasActiveUpload) {
      setUploadError(
        "Ya hay una carga en curso. Espera a que termine o cancelala antes de iniciar otra."
      );
      return;
    }

    const uploadItem = createUploadItem(file);
    setUploadError("");
    setUploadItems([uploadItem]);

    let validation;

    try {
      validation = validateFileBeforeRead(file, assetType);
    } catch (error) {
      const message =
        error.message || "El archivo seleccionado no es valido para este campo.";
      updateUploadItem(uploadItem.id, {
        status: "fallido",
        progress: 0,
        message,
      });
      setUploadError(message);
      return;
    }

    try {
      const { effectiveMimeType, isSvg } = validation;
      let payload;

      if (isSvg) {
        const svgContent = validateSafeSvgContent(
          await readFileAsText(file, uploadItem.id)
        );
        payload = {
          asset_type: assetType,
          file_name: file.name,
          mime_type: effectiveMimeType,
          svg_content: svgContent,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
        };
      } else {
        const base64 = await readFileAsBase64(file, uploadItem.id);
        payload = {
          asset_type: assetType,
          file_name: file.name,
          mime_type: effectiveMimeType,
          data_base64: base64,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
        };
      }

      abortControllerRef.current = new AbortController();
      updateUploadItem(uploadItem.id, {
        status: "subiendo",
        progress: 80,
        message: "Subiendo archivo al servidor...",
      });

      const newAsset = await uploadMediaAsset(payload, {
        signal: abortControllerRef.current.signal,
      });

      abortControllerRef.current = null;

      if (onAssetUploaded) {
        onAssetUploaded(newAsset);
      }

      if (onChange) {
        onChange(newAsset.id);
      }

      updateUploadItem(uploadItem.id, {
        status: "completado",
        progress: 100,
        message: "Archivo subido correctamente.",
      });
    } catch (error) {
      abortControllerRef.current = null;

      if (error?.name === "AbortError" || error?.isAbortError) {
        updateUploadItem(uploadItem.id, {
          status: "cancelado",
          progress: 0,
          message: "La carga fue cancelada.",
        });
        setUploadError("La carga actual fue cancelada.");
        return;
      }

      const message = error.message || "No se pudo subir el archivo.";
      updateUploadItem(uploadItem.id, {
        status: "fallido",
        progress: 0,
        message,
      });
      setUploadError(message);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    void processFile(file);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files || []);

    if (droppedFiles.length > 1) {
      setUploadError(
        "Este selector solo admite un archivo a la vez. Si necesitas varias imagenes, usa la galeria del proyecto."
      );
      return;
    }

    void processFile(droppedFiles[0]);
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

  function handleSelectAsset(assetId) {
    if (disabled || hasActiveUpload) {
      return;
    }

    if (onChange) {
      onChange(assetId);
    }

    setModalOpen(false);
  }

  function handleClearAsset() {
    if (disabled || hasActiveUpload) {
      return;
    }

    if (onChange) {
      onChange(null);
    }
  }

  function handleOpenModal() {
    setUploadError("");
    setModalOpen(true);
  }

  function handleCloseModal() {
    if (hasActiveUpload) {
      const shouldCancel = window.confirm(
        "Hay una carga en curso. Si cierras ahora, se cancelara el upload actual. ¿Deseas continuar?"
      );

      if (!shouldCancel) {
        return;
      }

      cancelActiveUpload();
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
    <div className={`image-picker${disabled ? " image-picker--disabled" : ""}`}>
      <span className="image-picker__label">{label}</span>

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
          ) : previewSvgSrc ? (
            <img
              src={previewSvgSrc}
              alt={selectedAsset?.alt_text || label}
              className="image-picker__preview-img"
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
              disabled={disabled || hasActiveUpload}
            >
              Quitar
            </button>
          )}

          {value && <span className="image-picker__id-badge">Asset #{value}</span>}
        </div>
      </div>

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
              <h3 className="image-picker__modal-title">Seleccionar imagen</h3>
              <button
                type="button"
                className="image-picker__modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div
              className={`image-picker__dropzone${dragging ? " image-picker__dropzone--dragging" : ""}${hasActiveUpload ? " image-picker__dropzone--uploading" : ""}`}
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
                accept={getUploadRules(assetType).acceptAttr}
                className="image-picker__file-input"
                onChange={handleFileChange}
                disabled={hasActiveUpload}
              />

              {hasActiveUpload ? (
                <>
                  <span className="image-picker__upload-icon">⏳</span>
                  <p className="image-picker__upload-label">
                    Carga en curso. Espera o cancelala para iniciar otra.
                  </p>
                </>
              ) : (
                <>
                  <span className="image-picker__upload-icon">⬆️</span>
                  <p className="image-picker__upload-label">
                    Arrastra un archivo o haz clic para subir
                  </p>
                  <p className="image-picker__upload-hint">
                    {assetType === "document"
                      ? "Archivos PDF hasta 10 MB"
                      : "PNG, JPG, WebP o SVG dentro del limite permitido"}
                  </p>
                </>
              )}
            </div>

            {hasActiveUpload && (
              <div className="image-picker__upload-warning">
                <span>La carga sigue en curso. Si cierras el modal, se cancelara.</span>
                <button
                  type="button"
                  className="admin-button ghost"
                  onClick={cancelActiveUpload}
                >
                  Cancelar carga
                </button>
              </div>
            )}

            {uploadItems.length > 0 && (
              <div className="image-picker__upload-list" aria-live="polite">
                {uploadItems.map((item) => (
                  <article
                    key={item.id}
                    className={`image-picker__upload-item image-picker__upload-item--${item.status}`}
                  >
                    <div className="image-picker__upload-top">
                      <strong>{item.fileName}</strong>
                      <span>{getStatusLabel(item.status)}</span>
                    </div>
                    <div className="image-picker__upload-progress">
                      <span
                        className="image-picker__upload-progress-bar"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="image-picker__upload-meta">
                      <span>{item.message}</span>
                      <span>{item.progress}%</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {uploadError && <p className="image-picker__upload-error">{uploadError}</p>}

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
                    const safeSvgSrc = getSafeSvgDataUrl(asset.svg_content);
                    const isSelected = asset.id === value;
                    const isItemPdf = asset.mime_type === "application/pdf";

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className={`image-picker__gallery-item${isSelected ? " image-picker__gallery-item--selected" : ""}`}
                        onClick={() => handleSelectAsset(asset.id)}
                        title={asset.alt_text || asset.file_name || `Asset #${asset.id}`}
                        disabled={hasActiveUpload}
                      >
                        {isItemPdf ? (
                          <div
                            className="image-picker__gallery-placeholder"
                            style={{ fontSize: "2rem" }}
                          >
                            📄
                          </div>
                        ) : src ? (
                          <img
                            src={src}
                            alt={asset.alt_text || ""}
                            className="image-picker__gallery-img"
                          />
                        ) : safeSvgSrc ? (
                          <img
                            src={safeSvgSrc}
                            alt={asset.alt_text || asset.file_name || ""}
                            className="image-picker__gallery-img"
                          />
                        ) : (
                          <div className="image-picker__gallery-placeholder">?</div>
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
