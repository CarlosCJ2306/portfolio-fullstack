const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ADMIN_STORAGE_KEY = "portfolio-admin-auth";

function encodeBasicAuth(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function parseJsonMaybe(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getStoredAdminCredentials() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(ADMIN_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsed = parseJsonMaybe(rawValue);

  if (!parsed?.username || !parsed?.password) {
    return null;
  }

  return parsed;
}

export function setStoredAdminCredentials(credentials) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ADMIN_STORAGE_KEY,
    JSON.stringify(credentials)
  );
}

export function clearStoredAdminCredentials() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}

async function request(endpoint, options = {}, credentials) {
  if (!API_BASE_URL) {
    throw new Error("No estÃ¡ configurada la variable VITE_API_BASE_URL.");
  }

  const authCredentials = credentials || getStoredAdminCredentials();

  if (!authCredentials?.username || !authCredentials?.password) {
    throw new Error("No hay credenciales administrativas guardadas.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: encodeBasicAuth(
        authCredentials.username,
        authCredentials.password
      ),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    let errorMessage = "Error al consumir la API administrativa.";

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

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

export function loginAdmin(credentials) {
  return request(
    "/api/admin/auth/login",
    {
      method: "POST",
    },
    credentials
  );
}

export function getAdminDashboard() {
  return request("/api/admin/dashboard");
}

export function getAdminProfile() {
  return request("/api/admin/profile");
}

export function updateAdminProfile(payload) {
  return request("/api/admin/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getAdminContactMessages() {
  return request("/api/admin/contact-messages");
}

export function markAdminContactMessageAsRead(contactMessageId) {
  return request(`/api/admin/contact-messages/${contactMessageId}/read`, {
    method: "PATCH",
  });
}

export function getAdminSkills() {
  return request("/api/admin/skills");
}

export function createAdminSkill(payload) {
  return request("/api/admin/skills", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminSkill(skillId, payload) {
  return request(`/api/admin/skills/${skillId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminSkill(skillId) {
  return request(`/api/admin/skills/${skillId}`, {
    method: "DELETE",
  });
}

export function getAdminProjects() {
  return request("/api/admin/projects");
}

export function createAdminProject(payload) {
  return request("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminProject(projectId, payload) {
  return request(`/api/admin/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminProject(projectId) {
  return request(`/api/admin/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function getAdminExperience() {
  return request("/api/admin/experience");
}

export function createAdminExperience(payload) {
  return request("/api/admin/experience", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminExperience(experienceId, payload) {
  return request(`/api/admin/experience/${experienceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminExperience(experienceId) {
  return request(`/api/admin/experience/${experienceId}`, {
    method: "DELETE",
  });
}

export function getAdminEducation() {
  return request("/api/admin/education");
}

export function createAdminEducation(payload) {
  return request("/api/admin/education", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminEducation(educationId, payload) {
  return request(`/api/admin/education/${educationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminEducation(educationId) {
  return request(`/api/admin/education/${educationId}`, {
    method: "DELETE",
  });
}

export function getAdminCertifications() {
  return request("/api/admin/certifications");
}

export function createAdminCertification(payload) {
  return request("/api/admin/certifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCertification(certificationId, payload) {
  return request(`/api/admin/certifications/${certificationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCertification(certificationId) {
  return request(`/api/admin/certifications/${certificationId}`, {
    method: "DELETE",
  });
}

export function getAdminSocialLinks() {
  return request("/api/admin/social-links");
}

export function createAdminSocialLink(payload) {
  return request("/api/admin/social-links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminSocialLink(socialLinkId, payload) {
  return request(`/api/admin/social-links/${socialLinkId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminSocialLink(socialLinkId) {
  return request(`/api/admin/social-links/${socialLinkId}`, {
    method: "DELETE",
  });
}

// -----------------------------------------------------------------------------
//                              MEDIA ASSETS
// -----------------------------------------------------------------------------

export function listMediaAssets(assetType = null) {
  const query = assetType ? `?asset_type=${encodeURIComponent(assetType)}` : "";
  return request(`/api/admin/media-assets${query}`);
}

export function uploadMediaAsset(payload) {
  return request("/api/admin/media-assets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteMediaAsset(assetId) {
  return request(`/api/admin/media-assets/${assetId}`, {
    method: "DELETE",
  });
}
