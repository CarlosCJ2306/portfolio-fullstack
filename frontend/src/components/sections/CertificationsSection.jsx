import { useEffect, useState } from "react";
import "./CertificationsSection.css";

function createPdfObjectUrl(certificateFile) {
  if (
    !certificateFile?.data_base64 ||
    certificateFile?.mime_type !== "application/pdf"
  ) {
    return "";
  }

  try {
    const base64 = certificateFile.data_base64.startsWith("data:")
      ? certificateFile.data_base64.split(",")[1] || ""
      : certificateFile.data_base64;

    if (!base64) {
      return "";
    }

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch {
    return "";
  }
}

export default function CertificationsSection({ certifications = [] }) {
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    if (!selectedPdf) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPdf((currentPdf) => {
          if (currentPdf?.url) {
            URL.revokeObjectURL(currentPdf.url);
          }

          return null;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPdf]);

  useEffect(() => {
    return () => {
      if (selectedPdf?.url) {
        URL.revokeObjectURL(selectedPdf.url);
      }
    };
  }, [selectedPdf]);

  function closePdfModal() {
    setSelectedPdf((currentPdf) => {
      if (currentPdf?.url) {
        URL.revokeObjectURL(currentPdf.url);
      }

      return null;
    });
  }

  function openPdfModal(certificationName, certificateFile) {
    const pdfUrl = createPdfObjectUrl(certificateFile);

    if (!pdfUrl) {
      return;
    }

    setSelectedPdf((currentPdf) => {
      if (currentPdf?.url) {
        URL.revokeObjectURL(currentPdf.url);
      }

      return {
        name: certificationName,
        url: pdfUrl,
      };
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

            <h2>Certificaciones y formación complementaria</h2>

            <p>
              Aún no hay certificaciones registradas para mostrar en el
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
              perfil técnico y profesional.
            </p>
          </div>

          <div className="certifications-grid">
            {certifications.map((certification) => {
              const certificationName =
                certification.name ||
                certification.title ||
                certification.certification_name ||
                "Certificación";

              const issuer =
                certification.issuer ||
                certification.organization ||
                certification.institution ||
                "Entidad emisora";

              const issueDate =
                certification.issue_date ||
                certification.date ||
                certification.completed_at ||
                "";

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

              return (
                <article
                  className="certification-card"
                  key={certification.id || `${certificationName}-${issuer}`}
                >
                  <div className="certification-icon">✓</div>

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
                        <button
                          type="button"
                          className="certification-link certification-button"
                          onClick={() =>
                            openPdfModal(
                              certificationName,
                              certification.certificate_file,
                            )
                          }
                        >
                          Abrir PDF
                        </button>
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
              <h3>{selectedPdf.name}</h3>

              <button
                type="button"
                className="pdf-modal-close"
                onClick={closePdfModal}
                aria-label="Cerrar PDF"
              >
                Cerrar
              </button>
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
