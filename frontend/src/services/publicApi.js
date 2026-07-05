const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * FunciÃ³n base para consumir endpoints pÃºblicos del backend.
 * AquÃ­ centralizamos fetch para no repetir lÃ³gica en cada componente.
 */
async function request(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("No estÃ¡ configurada la variable VITE_API_BASE_URL.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    let errorMessage = "Error al consumir la API.";

    try {
      if (contentType.includes("application/json")) {
        const errorData = await response.json();

        errorMessage =
          errorData?.detail ||
          errorData?.message ||
          errorData?.error ||
          JSON.stringify(errorData);
      } else {
        const errorText = await response.text();

        errorMessage = errorText || errorMessage;
      }
    } catch {
      // Conserva el mensaje por defecto si no se puede interpretar la respuesta.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Debe traer toda la informaciÃ³n principal del portafolio:
 * perfil, redes, skills, proyectos, experiencia, educaciÃ³n y certificaciones.
 */
export function getHomeData() {
  return request("/api/public/home");
}

export function getProfile() {
  return request("/api/public/profile");
}

export function getSocialLinks() {
  return request("/api/public/social-links");
}

export function getSkills() {
  return request("/api/public/skills");
}

export function getProjects() {
  return request("/api/public/projects");
}

export function getFeaturedProjects() {
  return request("/api/public/projects/featured");
}

export function getExperience() {
  return request("/api/public/experience");
}

export function getEducation() {
  return request("/api/public/education");
}

export function getCertifications() {
  return request("/api/public/certifications");
}

/**
 * Debe enviar la informaciÃ³n del formulario de contacto al backend.
 */
export function sendContactMessage(data) {
  return request("/api/public/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
