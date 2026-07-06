import { useEffect, useMemo, useState } from "react";
import { getSafeSvgDataUrl } from "../../utils/svgSecurity";
import "./ProjectsSection.css";

function decodeBase64ToText(base64Value) {
  if (!base64Value) {
    return "";
  }

  try {
    const normalizedBase64 = base64Value.startsWith("data:")
      ? base64Value.split(",")[1] || ""
      : base64Value;

    if (!normalizedBase64) {
      return "";
    }

    const binary = window.atob(normalizedBase64);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function getAssetDisplayInfo(asset, fallbackAltText) {
  if (!asset) {
    return {
      src: null,
      alt: fallbackAltText,
      isBlocked: false,
      hasAsset: false,
    };
  }

  const alt = asset.alt_text || fallbackAltText;
  const safeSvgSrc =
    getSafeSvgDataUrl(asset.svg_content)
    || getSafeSvgDataUrl(decodeBase64ToText(asset.data_base64));

  if (safeSvgSrc) {
    return {
      src: safeSvgSrc,
      alt,
      isBlocked: false,
      hasAsset: true,
    };
  }

  const isSvgAsset =
    asset.mime_type === "image/svg+xml" || Boolean(asset.svg_content);

  if (isSvgAsset) {
    return {
      src: null,
      alt,
      isBlocked: true,
      hasAsset: true,
    };
  }

  if (asset.data_base64 && asset.mime_type) {
    return {
      src: `data:${asset.mime_type};base64,${asset.data_base64}`,
      alt,
      isBlocked: false,
      hasAsset: true,
    };
  }

  return {
    src: null,
    alt,
    isBlocked: false,
    hasAsset: true,
  };
}

function buildProjectImages(project) {
  const coverDisplay = getAssetDisplayInfo(
    project?.image,
    project?.title || project?.name || "Portada del proyecto"
  );

  const coverImage = coverDisplay.src
    ? {
        key: `cover-${project?.image?.id ?? "main"}`,
        id: project?.image?.id ?? null,
        src: coverDisplay.src,
        alt: coverDisplay.alt,
        label: "Portada",
      }
    : null;

  const galleryImages = Array.isArray(project?.gallery_images)
    ? project.gallery_images
        .map((item, index) => {
          const image = item?.image;
          const imageDisplay = getAssetDisplayInfo(
            image,
            project?.title || project?.name || `Imagen ${index + 1} del proyecto`
          );

          if (!imageDisplay.src) {
            return null;
          }

          return {
            key: `gallery-${item.media_asset_id ?? index}`,
            id: item.media_asset_id ?? null,
            src: imageDisplay.src,
            alt: imageDisplay.alt,
            label: `Galeria ${index + 1}`,
          };
        })
        .filter(Boolean)
    : [];

  const allImages = [];
  const seenImageIds = new Set();

  if (coverImage?.src) {
    allImages.push(coverImage);

    if (coverImage.id !== null) {
      seenImageIds.add(coverImage.id);
    }
  }

  galleryImages.forEach((image) => {
    if (image.id !== null && seenImageIds.has(image.id)) {
      return;
    }

    if (image.id !== null) {
      seenImageIds.add(image.id);
    }

    allImages.push(image);
  });

  return allImages;
}

function getProjectDescription(project) {
  return (
    project?.description
    || project?.short_description
    || "Sin descripcion adicional para este proyecto."
  );
}

export default function ProjectsSection({
  projects = [],
  isLoading = false,
  errorMessage = "",
  onRetry = null,
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasProjects = Array.isArray(projects) && projects.length > 0;
  const showEmptyLoadingState = isLoading && !hasProjects;
  const showEmptyErrorState = Boolean(errorMessage) && !hasProjects;

  const modalImages = useMemo(
    () => buildProjectImages(selectedProject),
    [selectedProject]
  );

  const activeImage = modalImages[activeImageIndex] || null;

  useEffect(() => {
    if (!selectedProject) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedProject(null);
        setActiveImageIndex(0);
        setIsZoomed(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedProject]);

  function openProjectModal(project) {
    setSelectedProject(project);
    setActiveImageIndex(0);
    setIsZoomed(false);
  }

  function closeProjectModal() {
    setSelectedProject(null);
    setActiveImageIndex(0);
    setIsZoomed(false);
  }

  function goToImage(nextIndex) {
    if (nextIndex < 0 || nextIndex >= modalImages.length) {
      return;
    }

    setActiveImageIndex(nextIndex);
    setIsZoomed(false);
  }

  function showPreviousImage() {
    if (modalImages.length <= 1) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? modalImages.length - 1 : currentIndex - 1
    );
    setIsZoomed(false);
  }

  function showNextImage() {
    if (modalImages.length <= 1) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex === modalImages.length - 1 ? 0 : currentIndex + 1
    );
    setIsZoomed(false);
  }

  function toggleZoom() {
    if (!activeImage) {
      return;
    }

    setIsZoomed((currentValue) => !currentValue);
  }

  if (showEmptyLoadingState) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <div className="projects-heading">
            <span className="badge">Proyectos</span>
            <h2>Proyectos destacados</h2>
            <p>Cargando proyectos del portafolio...</p>
          </div>
        </div>
      </section>
    );
  }

  if (showEmptyErrorState) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <div className="projects-heading">
            <span className="badge">Proyectos</span>
            <h2>Proyectos destacados</h2>
            <p>{errorMessage}</p>

            {onRetry && (
              <div className="projects-status projects-status--error">
                <button
                  type="button"
                  className="projects-retry-button"
                  onClick={onRetry}
                  disabled={isLoading}
                >
                  {isLoading ? "Reintentando..." : "Reintentar proyectos"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!hasProjects) {
    return (
      <section id="projects" className="projects-section">
        <div className="container">
          <div className="projects-heading">
            <span className="badge">Proyectos</span>
            <h2>Proyectos destacados</h2>
            <p>
              Aun no hay proyectos registrados para mostrar en el portafolio.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="projects" className="projects-section">
        <div className="container">
          <div className="projects-heading">
            <span className="badge">Proyectos</span>
            <h2>Proyectos destacados</h2>
            <p>
              Soluciones desarrolladas con enfoque practico, arquitectura backend,
              consumo de APIs y construccion de interfaces modernas.
            </p>
          </div>

          {errorMessage && (
            <div className="projects-status projects-status--error">
              <p>{errorMessage}</p>

              {onRetry && (
                <button
                  type="button"
                  className="projects-retry-button"
                  onClick={onRetry}
                  disabled={isLoading}
                >
                  {isLoading ? "Reintentando..." : "Reintentar proyectos"}
                </button>
              )}
            </div>
          )}

          <div className="projects-grid">
            {projects.map((project) => {
              const projectTitle = project.title || project.name || "Proyecto";
              const projectDescription =
                project.short_description ||
                project.summary ||
                project.description ||
                "Proyecto desarrollado como parte del portafolio profesional.";

              const repositoryUrl =
                project.repository_url ||
                project.github_url ||
                project.repo_url ||
                "";

              const demoUrl =
                project.demo_url ||
                project.live_url ||
                project.url ||
                "";

              const isFeatured = project.is_featured || project.featured || false;

              const technologies =
                project.skills ||
                project.technologies ||
                project.project_skills ||
                [];

              const coverDisplay = getAssetDisplayInfo(
                project.image,
                project.image?.alt_text || projectTitle
              );
              const hasHiddenUnsafeImage = coverDisplay.hasAsset && !coverDisplay.src;

              return (
                <article className="project-card" key={project.id || projectTitle}>
                  {coverDisplay.src ? (
                    <div className="project-image-container">
                      <img
                        src={coverDisplay.src}
                        alt={coverDisplay.alt}
                        className="project-image"
                      />
                    </div>
                  ) : (
                    <div className="project-image-container project-image-container--fallback">
                      <span className="project-image-fallback">
                        {hasHiddenUnsafeImage
                          ? "Imagen no disponible por seguridad."
                          : "Sin imagen disponible"}
                      </span>
                    </div>
                  )}

                  <div className="project-card-top">
                    {isFeatured && <span className="project-featured">Destacado</span>}
                    <h3>{projectTitle}</h3>
                    <p>{projectDescription}</p>
                  </div>

                  {Array.isArray(technologies) && technologies.length > 0 && (
                    <div className="project-tech-list">
                      {technologies.map((tech) => {
                        const techName =
                          tech.name ||
                          tech.title ||
                          tech.skill_name ||
                          tech;

                        return (
                          <span key={`${projectTitle}-${techName}`}>
                            {techName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="project-actions">
                    <button
                      type="button"
                      className="project-action-button"
                      onClick={() => openProjectModal(project)}
                    >
                      Ver detalle
                    </button>

                    {repositoryUrl && (
                      <a href={repositoryUrl} target="_blank" rel="noreferrer">
                        Repositorio
                      </a>
                    )}

                    {demoUrl && (
                      <a href={demoUrl} target="_blank" rel="noreferrer">
                        Ver demo
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {selectedProject && (
        <div
          className="project-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle del proyecto ${selectedProject.title || selectedProject.name || ""}`}
        >
          <div className="project-modal">
            <div className="project-modal__header">
              <div>
                <span className="badge">Proyecto</span>
                <h3>{selectedProject.title || selectedProject.name || "Proyecto"}</h3>
              </div>

              <button
                type="button"
                className="project-modal__close"
                onClick={closeProjectModal}
                aria-label="Cerrar detalle del proyecto"
              >
                X
              </button>
            </div>

            <div className="project-modal__body">
              <div className="project-modal__media">
                {activeImage ? (
                  <div className="project-modal__viewer">
                    <div className={`project-modal__stage${isZoomed ? " project-modal__stage--zoomed" : ""}`}>
                      <img
                        src={activeImage.src}
                        alt={activeImage.alt}
                        className={`project-modal__image${isZoomed ? " project-modal__image--zoomed" : ""}`}
                        onClick={toggleZoom}
                      />
                    </div>

                    <div className="project-modal__toolbar">
                      <span className="project-modal__image-label">
                        {activeImage.label}
                        {modalImages.length > 1
                          ? ` / ${activeImageIndex + 1} de ${modalImages.length}`
                          : ""}
                      </span>

                      <button
                        type="button"
                        className="project-modal__zoom"
                        onClick={toggleZoom}
                      >
                        {isZoomed ? "Ajustar" : "Zoom"}
                      </button>
                    </div>

                    {modalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="project-modal__nav project-modal__nav--prev"
                          onClick={showPreviousImage}
                          aria-label="Imagen anterior"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          className="project-modal__nav project-modal__nav--next"
                          onClick={showNextImage}
                          aria-label="Imagen siguiente"
                        >
                          Siguiente
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="project-modal__viewer project-modal__viewer--empty">
                    <span>Sin imagen disponible para este proyecto.</span>
                  </div>
                )}

                {modalImages.length > 0 && (
                  <div className="project-modal__thumbs">
                    {modalImages.map((image, index) => (
                      <button
                        type="button"
                        key={image.key}
                        className={`project-modal__thumb${index === activeImageIndex ? " project-modal__thumb--active" : ""}`}
                        onClick={() => goToImage(index)}
                        aria-label={`Ver ${image.label.toLowerCase()}`}
                      >
                        <img src={image.src} alt={image.alt} />
                        <span>{image.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-modal__content">
                <p className="project-modal__description">
                  {getProjectDescription(selectedProject)}
                </p>

                {Array.isArray(selectedProject.skills) && selectedProject.skills.length > 0 && (
                  <div className="project-modal__skills">
                    <strong>Skills</strong>
                    <div className="project-tech-list project-tech-list--modal">
                      {selectedProject.skills.map((skill) => (
                        <span key={`${selectedProject.id || "project"}-${skill.id || skill.name || skill}`}>
                          {skill.name || skill.title || skill.skill_name || skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="project-modal__links">
                  {selectedProject.repository_url && (
                    <a
                      href={selectedProject.repository_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Repositorio
                    </a>
                  )}

                  {selectedProject.demo_url && (
                    <a
                      href={selectedProject.demo_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
