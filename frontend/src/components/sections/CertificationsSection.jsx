import { useEffect, useState } from "react";
import "./CertificationsSection.css";

function createPdfPreviewResource(certificateFile) {
  if (
    !certificateFile?.data_base64 ||
    certificateFile?.mime_type !== "application/pdf"
  ) {
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
      error: "No se pudo preparar el PDF para mostrarlo. Intenta abrirlo o descargarlo nuevamente.",
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

  const base64 = certificateFile.data_base64.startsWith("data:")
    ? certificateFile.data_base64
    : `data:application/pdf;base64,${certificateFile.data_base64}`;

  return base64;
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

  useEffect(() => {
    if (!selectedPdf) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPdf(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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

  function closePdfModal() {
    setSelectedPdf(null);
  }

  function openPdfModal(certification) {
    const certificationName =
      certification?.name ||
      certification?.title ||
      certification?.certification_name ||
      "Certificacion";

    const previewResource = createPdfPreviewResource(
      certification?.certificate_file
    );

    if (!previewResource.url) {
      setPdfErrorMessage(previewResource.error);
      return;
    }

    setPdfErrorMessage("");
    setSelectedPdf({
      name: certificationName,
      url: previewResource.url,
      downloadUrl: buildPdfDataUrl(certification?.certificate_file),
      fileName: `${certificationName}.pdf`,
    });
  }

  const hasCertifications =
    Array.isArray(certifications) && certifications.length > 0;

  if (!hasCertifications) {
    return (
      <section id="certifications" className="certifications-section">
        <div className="container">
          <div className="certifications-heading">
            <span className="badge">Certificaciones</span>

            <h2>Certificaciones y formacion complementaria</h2>

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

            <h2>Certificaciones y formacion complementaria</h2>

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
                Boolean(certification.certificate_file?.data_base64);

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
                            onClick={() => openPdfModal(certification)}
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
          onClick={closePdfModal}
          role="presentation"
        >
          <div
            className="pdf-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Vista previa de ${selectedPdf.name}`}
          >
            <div className="pdf-modal-header">
              <div className="pdf-modal-header__content">
                <h3>{selectedPdf.name}</h3>
                <p>
                  Si tu navegador no muestra la vista previa, usa Abrir o
                  Descargar.
                </p>
              </div>

              <button
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
              >
                Abrir en nueva pestana
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
            />
          </div>
        </div>
      )}
    </>
  );
}
