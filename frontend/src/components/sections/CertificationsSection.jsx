import { useEffect, useRef, useState } from "react";
import { buildLegacyAssetDataUrl, resolveMediaContentUrl } from "../../utils/mediaContent";
import "./CertificationsSection.css";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'iframe',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled")
      && element.getAttribute("aria-hidden") !== "true"
  );
}

async function createPdfPreviewResource(certificateFile) {
  if (
    !certificateFile ||
    certificateFile?.mime_type !== "application/pdf"
  ) {
    return {
      url: "",
      error: "El archivo PDF no esta disponible para vista previa.",
    };
  }

  const contentUrl = resolveMediaContentUrl(certificateFile);

  if (contentUrl) {
    try {
      const response = await fetch(contentUrl);

      if (!response.ok) {
        return {
          url: "",
          error: "El PDF no esta disponible para vista previa.",
        };
      }

      const blob = await response.blob();

      return {
        url: URL.createObjectURL(blob),
        error: "",
      };
    } catch {
      return {
        url: "",
        error:
          "No se pudo preparar el PDF para mostrarlo. Intenta abrirlo o descargarlo nuevamente.",
      };
    }
  }

  if (!certificateFile?.data_base64) {
    return {
      url: "",
      error: "El archivo PDF no esta disponible para vista previa.",
    };
  }

  try {
    const base64 = certificateFile.data_base64.startsWith("data:")
      ? certificateFile.data_base64.split(",")[1] || ""
      : certificateFile.data_base64;

    if (!base64) {
      return {
        url: "",
        error: "El archivo PDF no contiene datos validos para abrirse.",
      };
    }

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });

    return {
      url: URL.createObjectURL(blob),
      error: "",
    };
  } catch {
    return {
      url: "",
      error:
        "No se pudo preparar el PDF para mostrarlo. Intenta abrirlo o descargarlo nuevamente.",
    };
  }
}

function buildPdfDataUrl(certificateFile) {
  if (
    !certificateFile?.data_base64 ||
    certificateFile?.mime_type !== "application/pdf"
  ) {
    return "";
  }

  return buildLegacyAssetDataUrl(certificateFile);
}

function formatDateValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  return String(value);
}

export default function CertificationsSection({ certifications = [] }) {
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState("");
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastTriggerRef = useRef(null);

  const certificationModalTitleId = `certification-modal-title-${selectedPdf?.name || "active"}`;

  useEffect(() => {
    if (!selectedPdf) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const frameId = window.requestAnimationFrame(() => {
      const firstFocusable =
        closeButtonRef.current || getFocusableElements(modalRef.current)[0];

      (firstFocusable || modalRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedPdf]);

  useEffect(() => {
    const currentUrl = selectedPdf?.url;

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [selectedPdf]);

  function restoreTriggerFocus() {
    const trigger = lastTriggerRef.current;

    if (!trigger) {
      return;
    }

    window.requestAnimationFrame(() => {
      trigger.focus();
    });
  }

  function closePdfModal() {
    setSelectedPdf(null);
    restoreTriggerFocus();
  }

  async function openPdfModal(certification, triggerElement) {
    const certificationName =
      certification?.name ||
      certification?.title ||
      certification?.certification_name ||
      "Certificacion";

    const previewResource = await createPdfPreviewResource(
      certification?.certificate_file
    );

    if (!previewResource.url) {
      setPdfErrorMessage(previewResource.error);
      return;
    }

    lastTriggerRef.current = triggerElement || null;
    setPdfErrorMessage("");
    setSelectedPdf({
      name: certificationName,
      url: previewResource.url,
      downloadUrl: previewResource.url || buildPdfDataUrl(certification?.certificate_file),
      fileName: `${certificationName}.pdf`,
    });
  }

  function handlePdfModalKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePdfModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(modalRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      modalRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  const hasCertifications =
    Array.isArray(certifications) && certifications.length > 0;

  if (!hasCertifications) {
    return (
      <section id="certifications" className="certifications-section">
        <div className="container">
          <div className="certifications-heading">
            <span className="badge">Certificaciones</span>

            <h2>Certificaciones y formación complementaria</h2>

            <p>
              Aun no hay certificaciones registradas para mostrar en el
              portafolio.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="certifications" className="certifications-section">
        <div className="container">
          <div className="certifications-heading">
            <span className="badge">Certificaciones</span>

            <h2>Certificaciones y formación complementaria</h2>

            <p>
              Cursos, credenciales y aprendizajes adicionales que fortalecen mi
              perfil tecnico y profesional.
            </p>
          </div>

          {pdfErrorMessage && (
            <div className="certifications-alert" role="alert">
              <p>{pdfErrorMessage}</p>
            </div>
          )}

          <div className="certifications-grid">
            {certifications.map((certification) => {
              const certificationName =
                certification.name ||
                certification.title ||
                certification.certification_name ||
                "Certificacion";

              const issuer =
                certification.issuer ||
                certification.organization ||
                certification.institution ||
                "Entidad emisora";

              const issueDate = formatDateValue(
                certification.issue_date ||
                  certification.date ||
                  certification.completed_at ||
                  ""
              );
              const expirationDate = formatDateValue(certification.expiration_date || "");

              const credentialUrl =
                certification.credential_url ||
                certification.url ||
                certification.link ||
                "";

              const description =
                certification.description ||
                certification.summary ||
                "";

              const hasPdf =
                certification.certificate_file?.mime_type ===
                  "application/pdf" &&
                Boolean(
                  certification.certificate_file?.content_url
                  || certification.certificate_file?.data_base64
                );

              const pdfDataUrl = hasPdf
                ? buildPdfDataUrl(certification.certificate_file)
                : "";

              return (
                <article
                  className="certification-card"
                  key={certification.id || `${certificationName}-${issuer}`}
                >
                  <div className="certification-icon">PDF</div>

                  <div className="certification-content">
                    <h3>{certificationName}</h3>

                    <strong>{issuer}</strong>

                    {issueDate && (
                      <span className="certification-date">{issueDate}</span>
                    )}

                    {expirationDate && (
                      <span className="certification-date certification-date--expiration">
                        Vence: {expirationDate}
                      </span>
                    )}

                    {description && <p>{description}</p>}

                    <div className="certification-actions">
                      {credentialUrl && (
                        <a
                          href={credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="certification-link"
                        >
                          Ver credencial
                        </a>
                      )}

                      {hasPdf && (
                        <>
                          <button
                            type="button"
                            className="certification-link certification-button"
                            onClick={(event) =>
                              openPdfModal(certification, event.currentTarget)
                            }
                          >
                            Abrir PDF
                          </button>

                          {pdfDataUrl && (
                            <a
                              href={pdfDataUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="certification-link"
                            >
                              Abrir
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {selectedPdf && (
        <div
          className="pdf-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePdfModal();
            }
          }}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="pdf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={certificationModalTitleId}
            tabIndex={-1}
            onKeyDown={handlePdfModalKeyDown}
          >
            <div className="pdf-modal-header">
              <div className="pdf-modal-header__content">
                <h3 id={certificationModalTitleId}>{selectedPdf.name}</h3>
                <p>
                  Si tu navegador no muestra la vista previa, usa Abrir o Descargar.
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="pdf-modal-close"
                onClick={closePdfModal}
                aria-label="Cerrar PDF"
              >
                Cerrar
              </button>
            </div>

            <div className="pdf-modal-actions">
              <a
                href={selectedPdf.url}
                target="_blank"
                rel="noreferrer"
                className="certification-link"
                aria-label={`Abrir PDF de ${selectedPdf.name} en nueva pestana`}
              >
                Abrir
              </a>

              {selectedPdf.downloadUrl && (
                <a
                  href={selectedPdf.downloadUrl}
                  download={selectedPdf.fileName}
                  className="certification-link"
                >
                  Descargar PDF
                </a>
              )}
            </div>

            <iframe
              title={`PDF de ${selectedPdf.name}`}
              src={selectedPdf.url}
              className="pdf-modal-frame"
              tabIndex={0}
            />
          </div>
        </div>
      )}
    </>
  );
}
