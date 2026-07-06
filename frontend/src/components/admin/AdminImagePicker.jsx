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

const ASSET_TYPE_LABELS = {
  avatar: "Avatar",
  image: "Imagen",
  icon: "Icono",
  icon_svg: "Icono SVG",
  document: "Documento",
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

function getApproximateBase64Size(base64Value) {
  if (!base64Value) {
    return null;
  }

  const normalizedValue = String(base64Value).replace(/\s+/g, "");

  if (!normalizedValue) {
    return null;
  }

  const padding = normalizedValue.endsWith("==")
    ? 2
    : normalizedValue.endsWith("=")
      ? 1
      : 0;

  return Math.max(0, Math.floor((normalizedValue.length * 3) / 4) - padding);
}

function formatBytes(byteCount) {
  if (!Number.isFinite(byteCount) || byteCount <= 0) {
    return null;
  }

  if (byteCount < 1024) {
    return `${byteCount} B`;
  }

  const sizeInKb = byteCount / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(sizeInKb >= 100 ? 0 : 1)} KB`;
  }

  const sizeInMb = sizeInKb / 1024;
  return `${sizeInMb.toFixed(sizeInMb >= 100 ? 0 : 1)} MB`;
}

function getPickerCopy(assetType, hasValue) {
  if (assetType === "document") {
    return {
      selectButton: hasValue ? "Cambiar documento" : "Seleccionar documento",
      emptyText: "Sin documento",
      modalTitle: "Seleccionar documento PDF",
      dialogLabel: "Selector de documento PDF",
      uploadIdleLabel: "Arrastra un PDF o haz clic para subir",
      uploadBusyLabel: "Carga en curso. Espera o cancelala para iniciar otra.",
      uploadHint: "Archivos PDF hasta 10 MB",
      libraryCount: (count) =>
        count > 0
          ? `${count} documento${count !== 1 ? "s" : ""} disponible${count !== 1 ? "s" : ""}`
          : "No hay documentos PDF subidos aún. Sube el primero usando la zona de arriba.",
    };
  }

  if (assetType === "icon" || assetType === "icon_svg") {
    return {
      selectButton: hasValue ? "Cambiar icono" : "Seleccionar icono",
      emptyText: "Sin icono",
      modalTitle: "Seleccionar icono",
      dialogLabel: "Selector de icono",
      uploadIdleLabel: "Arrastra un archivo o haz clic para subir",
      uploadBusyLabel: "Carga en curso. Espera o cancelala para iniciar otra.",
      uploadHint: "PNG, JPG, WebP o SVG dentro del limite permitido",
      libraryCount: (count) =>
        count > 0
          ? `${count} icono${count !== 1 ? "s" : ""} disponible${count !== 1 ? "s" : ""}`
          : "No hay iconos subidos aún. Sube el primero usando la zona de arriba.",
    };
  }

  return {
    selectButton: hasValue ? "Cambiar imagen" : "Seleccionar imagen",
    emptyText: "Sin imagen",
    modalTitle: "Seleccionar imagen",
    dialogLabel: "Selector de imagen",
    uploadIdleLabel: "Arrastra un archivo o haz clic para subir",
    uploadBusyLabel: "Carga en curso. Espera o cancelala para iniciar otra.",
    uploadHint: "PNG, JPG, WebP o SVG dentro del limite permitido",
    libraryCount: (count) =>
      count > 0
        ? `${count} imagen${count !== 1 ? "es" : ""} disponible${count !== 1 ? "s" : ""}`
        : "No hay imágenes subidas aún. Sube la primera usando la zona de arriba.",
  };
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
  sessionUploadedAssets = [],
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
  const filteredAssets = Array.from(
    mediaAssets
      .filter((asset) => compatibleAssetTypes.includes(asset.asset_type))
      .reduce((assetMap, asset) => {
        if (!assetMap.has(asset.id)) {
          assetMap.set(asset.id, asset);
        }
        return assetMap;
      }, new Map())
      .values()
  );

  const selectedAsset =
    currentAsset || mediaAssets.find((asset) => asset.id === value) || null;
  const pickerCopy = getPickerCopy(assetType, Boolean(value));

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
  const selectedAssetSize = formatBytes(
    getApproximateBase64Size(selectedAsset?.data_base64)
  );
  const selectedAssetTypeLabel =
    ASSET_TYPE_LABELS[selectedAsset?.asset_type] || selectedAsset?.asset_type || null;

  function handleOpenPdf() {
    if (
      assetType !== "document"
      || !isPdf
      || !selectedAsset?.data_base64
      || typeof Uint8Array === "undefined"
    ) {
      return;
    }

    try {
      const binaryString = atob(selectedAsset.data_base64);
      const bytes = Uint8Array.from(binaryString, (character) =>
        character.charCodeAt(0)
      );
      const pdfBlob = new Blob([bytes], {
        type: selectedAsset.mime_type || "application/pdf",
      });
      const objectUrl = URL.createObjectURL(pdfBlob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      setUploadError(
        "No se pudo preparar el PDF para abrirlo. Verifica el archivo asociado."
      );
    }
  }

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
        message:
          "Asset guardado en la biblioteca. Guarda el formulario para asociarlo.",
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
                {pickerCopy.emptyText}
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
            {pickerCopy.selectButton}
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

      {selectedAsset && (
        <div className="image-picker__asset-meta-card">
          <div className="image-picker__asset-meta-grid">
            <span>
              <strong>Nombre:</strong>{" "}
              {selectedAsset.file_name || "Sin nombre"}
            </span>
            <span>
              <strong>Tipo:</strong>{" "}
              {selectedAssetTypeLabel || "No disponible"}
            </span>
            <span>
              <strong>MIME:</strong>{" "}
              {selectedAsset.mime_type || "No disponible"}
            </span>
            <span>
              <strong>Tamaño:</strong>{" "}
              {selectedAssetSize || "No disponible"}
            </span>
          </div>

          {assetType === "document" && (
            <div className="image-picker__asset-meta-actions">
              {isPdf && selectedAsset?.data_base64 ? (
                <button
                  type="button"
                  className="admin-button ghost"
                  onClick={handleOpenPdf}
                >
                  Abrir PDF
                </button>
              ) : (
                <span className="image-picker__asset-meta-note">
                  No hay PDF disponible para abrir o previsualizar.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {sessionUploadedAssets.length > 0 && (
        <div className="image-picker__lifecycle-note" role="status">
          <strong>Assets subidos durante esta edición:</strong>{" "}
          {sessionUploadedAssets
            .map((asset) => asset.file_name || `Asset #${asset.id}`)
            .join(", ")}
          . Ya están guardados en la biblioteca; solo quedan asociados a este
          registro al guardar el formulario. Cancelar o quitarlos no los elimina.
        </div>
      )}

      {modalOpen && (
        <div
          className="image-picker__overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label={pickerCopy.dialogLabel}
        >
          <div className="image-picker__modal">
            <div className="image-picker__modal-header">
              <h3 className="image-picker__modal-title">{pickerCopy.modalTitle}</h3>
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
                    {pickerCopy.uploadBusyLabel}
                  </p>
                </>
              ) : (
                <>
                  <span className="image-picker__upload-icon">⬆️</span>
                  <p className="image-picker__upload-label">
                    {pickerCopy.uploadIdleLabel}
                  </p>
                  <p className="image-picker__upload-hint">
                    {pickerCopy.uploadHint}
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
                {pickerCopy.libraryCount(filteredAssets.length)}
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
