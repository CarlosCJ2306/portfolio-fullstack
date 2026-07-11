import { buildApiUrl } from "../utils/apiConfig";
import { normalizeAdminEntityId } from "../utils/adminEntityIds";
const LEGACY_ADMIN_STORAGE_KEY = "portfolio-admin-auth";

export const ADMIN_AUTH_INVALID_EVENT = "portfolio-admin-auth-invalid";

let adminCredentials = null;

const FIELD_LABELS = {
  avatar_asset_id: "avatar",
  bullets: "bullets",
  certificate_file_id: "archivo PDF",
  category: "categoría",
  city: "ciudad",
  color: "color",
  company: "empresa",
  country: "país",
  credential_url: "URL de credencial",
  cv_url: "URL del CV",
  degree: "título",
  demo_url: "URL de demo",
  description: "descripción",
  display_order: "orden",
  email: "correo",
  end_date: "fecha de fin",
  end_year: "año de fin",
  field_of_study: "área de estudio",
  full_name: "nombre completo",
  gallery_image_ids: "galería de imágenes",
  icon_asset_id: "icono",
  icon_name: "nombre del icono",
  image_asset_id: "imagen principal",
  institution: "institución",
  is_active: "estado",
  is_current: "actualmente activo",
  issue_date: "fecha",
  issuer: "emisor",
  level: "nivel",
  location: "ubicación",
  message: "mensaje",
  name: "nombre",
  phone: "teléfono",
  platform: "plataforma",
  position: "cargo",
  professional_title: "título profesional",
  repository_url: "URL del repositorio",
  short_description: "descripción corta",
  skill_ids: "skills asociadas",
  slug: "slug",
  start_date: "fecha de inicio",
  start_year: "año de inicio",
  subject: "asunto",
  summary: "resumen",
  title: "título",
  url: "URL",
};

function createRequestError({
  message,
  status = null,
  details = null,
  userMessage = "",
  isNetworkError = false,
  isAbortError = false,
}) {
  const error = new Error(message);

  error.status = status;
  error.details = details;
  error.userMessage = userMessage || message;
  error.isNetworkError = isNetworkError;
  error.isAbortError = isAbortError;

  if (isAbortError) {
    error.name = "AbortError";
  }

  return error;
}

function encodeBasicAuth(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function shouldSetJsonContentType(body) {
  if (body == null) {
    return false;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return false;
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return false;
  }

  if (
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    return false;
  }

  return true;
}

function buildHeaders(headers, body, authorizationValue) {
  const finalHeaders = new Headers(headers || {});

  if (authorizationValue) {
    finalHeaders.set("Authorization", authorizationValue);
  }

  if (!finalHeaders.has("Content-Type") && shouldSetJsonContentType(body)) {
    finalHeaders.set("Content-Type", "application/json");
  }

  return finalHeaders;
}

function getFieldLabel(fieldName) {
  if (!fieldName || typeof fieldName !== "string") {
    return "formulario";
  }

  return FIELD_LABELS[fieldName] || fieldName.replaceAll("_", " ");
}

function normalizeValidationMessage(issue) {
  const locationParts = Array.isArray(issue?.loc) ? issue.loc : [];
  const stringLocations = locationParts.filter(
    (value) =>
      typeof value === "string"
      && value !== "body"
      && value !== "query"
      && value !== "path"
      && value !== "response"
  );
  const fieldName = stringLocations.at(-1) || "";
  const previousLocation = locationParts.at(-2);
  const fieldLabel = getFieldLabel(fieldName);
  const issueType = issue?.type || "";
  const rawMessage =
    typeof issue?.msg === "string"
      ? issue.msg.replace(/^Value error,\s*/i, "")
      : "Dato invalido.";
  const indexedLabel =
    typeof previousLocation === "number"
      ? `${fieldLabel} #${previousLocation + 1}`
      : fieldLabel;

  if (issueType.includes("missing")) {
    return `El campo ${indexedLabel} es obligatorio.`;
  }

  if (issueType.includes("string_too_short")) {
    const minLength = issue?.ctx?.min_length;

    if (typeof minLength === "number") {
      return `El campo ${indexedLabel} debe tener al menos ${minLength} caracteres.`;
    }
  }

  if (issueType.includes("string_too_long")) {
    const maxLength = issue?.ctx?.max_length;

    if (typeof maxLength === "number") {
      return `El campo ${indexedLabel} no puede superar ${maxLength} caracteres.`;
    }
  }

  if (issueType.includes("greater_than") || issueType.includes("ge")) {
    return `El campo ${indexedLabel} tiene un valor fuera del rango permitido.`;
  }

  if (issueType.includes("less_than") || issueType.includes("le")) {
    return `El campo ${indexedLabel} tiene un valor fuera del rango permitido.`;
  }

  if (issueType.includes("url")) {
    return `El campo ${indexedLabel} debe contener una URL valida.`;
  }

  if (issueType.includes("int_parsing") || issueType.includes("float_parsing")) {
    return `El campo ${indexedLabel} debe contener un numero valido.`;
  }

  if (rawMessage) {
    if (rawMessage.toLowerCase().startsWith("field required")) {
      return `El campo ${indexedLabel} es obligatorio.`;
    }

    return `${indexedLabel}: ${rawMessage}`;
  }

  return `Revisa el campo ${indexedLabel}.`;
}

function formatValidationDetails(detail) {
  if (!Array.isArray(detail) || detail.length === 0) {
    return "Revisa los datos enviados e intenta nuevamente.";
  }

  return detail
    .map((issue) => normalizeValidationMessage(issue))
    .filter(Boolean)
    .join(" ");
}

function formatObjectEntries(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const entries = Object.entries(value).flatMap(([key, entryValue]) => {
    const label = getFieldLabel(key);

    if (Array.isArray(entryValue)) {
      return entryValue
        .map((item) => `${label}: ${String(item)}`)
        .filter(Boolean);
    }

    if (entryValue && typeof entryValue === "object") {
      const nestedText = formatObjectEntries(entryValue);
      return nestedText ? `${label}: ${nestedText}` : [];
    }

    if (entryValue === null || entryValue === undefined || entryValue === "") {
      return [];
    }

    return `${label}: ${String(entryValue)}`;
  });

  return entries.join(" ");
}

function getDefaultStatusMessage(status) {
  switch (status) {
    case 400:
      return "La solicitud administrativa no pudo procesarse.";
    case 401:
      return "La autenticacion administrativa no es valida.";
    case 403:
      return "No tienes permisos para realizar esta accion.";
    case 404:
      return "No se encontro el recurso solicitado.";
    case 409:
      return "La operacion entra en conflicto con el estado actual del recurso.";
    case 422:
      return "Revisa los datos enviados e intenta nuevamente.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "El servidor no pudo completar la operacion administrativa.";
    default:
      return "Error al consumir la API administrativa.";
  }
}

async function parseErrorPayload(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function buildErrorFromResponse(response, payload) {
  const defaultMessage = getDefaultStatusMessage(response.status);
  let userMessage = defaultMessage;

  if (response.status === 422 && Array.isArray(payload?.detail)) {
    userMessage = formatValidationDetails(payload.detail);
  } else if (response.status === 422 && payload?.detail && typeof payload.detail === "object") {
    userMessage =
      formatObjectEntries(payload.detail) || defaultMessage;
  } else if (typeof payload?.detail === "string" && payload.detail.trim()) {
    userMessage = payload.detail.trim();
  } else if (payload?.detail && typeof payload.detail === "object") {
    userMessage =
      formatObjectEntries(payload.detail) || defaultMessage;
  } else if (typeof payload?.message === "string" && payload.message.trim()) {
    userMessage = payload.message.trim();
  } else if (payload && typeof payload === "object") {
    userMessage =
      formatObjectEntries(payload) || defaultMessage;
  } else if (typeof payload === "string" && payload.trim()) {
    userMessage = payload.trim();
  }

  return createRequestError({
    message: userMessage,
    status: response.status,
    details: payload,
    userMessage,
  });
}

function clearLegacyAdminCredentials() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);
  } catch {
    // El acceso al storage puede estar bloqueado por la configuracion del navegador.
  }

  try {
    window.sessionStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);
  } catch {
    // Mantiene operativo el login en memoria aunque storage no este disponible.
  }
}

function notifyInvalidAdminAuth() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_AUTH_INVALID_EVENT));
  }
}

clearLegacyAdminCredentials();

function getAdminCredentials() {
  return adminCredentials;
}

export function setAdminCredentials(credentials) {
  if (!credentials?.username || !credentials?.password) {
    adminCredentials = null;
    return;
  }

  adminCredentials = {
    username: credentials.username,
    password: credentials.password,
  };
}

export function clearAdminCredentials() {
  adminCredentials = null;
  clearLegacyAdminCredentials();
}

async function request(endpoint, options = {}, credentials) {
  const authCredentials = credentials || getAdminCredentials();

  if (!authCredentials?.username || !authCredentials?.password) {
    throw new Error("No hay una sesion administrativa activa.");
  }

  const { headers, body, method = "GET", ...restOptions } = options;
  const authorizationValue = encodeBasicAuth(
    authCredentials.username,
    authCredentials.password
  );
  let response;

  try {
    response = await fetch(buildApiUrl(endpoint), {
      ...restOptions,
      method,
      headers: buildHeaders(headers, body, authorizationValue),
      ...(body !== undefined ? { body } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createRequestError({
        message: "La solicitud fue cancelada.",
        isAbortError: true,
      });
    }

    throw createRequestError({
      message:
        "No fue posible conectar con el servidor administrativo. Verifica tu conexion e intenta nuevamente.",
      userMessage:
        "No fue posible conectar con el servidor administrativo. Verifica tu conexion e intenta nuevamente.",
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    const errorPayload = await parseErrorPayload(response);

    if (response.status === 401 || response.status === 403) {
      clearAdminCredentials();
      notifyInvalidAdminAuth();
    }

    throw buildErrorFromResponse(response, errorPayload);
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

async function requestBlob(endpointOrUrl, options = {}) {
  const authCredentials = getAdminCredentials();

  if (!authCredentials?.username || !authCredentials?.password) {
    throw new Error("No hay una sesion administrativa activa.");
  }

  const { headers, method = "GET", ...restOptions } = options;
  const authorizationValue = encodeBasicAuth(
    authCredentials.username,
    authCredentials.password
  );
  const isAbsoluteUrl = /^https?:\/\//i.test(endpointOrUrl);
  const requestUrl = isAbsoluteUrl
    ? endpointOrUrl
    : buildApiUrl(endpointOrUrl);
  let response;

  try {
    response = await fetch(requestUrl, {
      ...restOptions,
      method,
      headers: buildHeaders(headers, null, authorizationValue),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createRequestError({
        message: "La solicitud fue cancelada.",
        isAbortError: true,
      });
    }

    throw createRequestError({
      message:
        "No fue posible conectar con el servidor administrativo. Verifica tu conexion e intenta nuevamente.",
      userMessage:
        "No fue posible conectar con el servidor administrativo. Verifica tu conexion e intenta nuevamente.",
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    const errorPayload = await parseErrorPayload(response);

    if (response.status === 401 || response.status === 403) {
      clearAdminCredentials();
      notifyInvalidAdminAuth();
    }

    throw buildErrorFromResponse(response, errorPayload);
  }

  return response.blob();
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
  const normalizedContactMessageId = normalizeAdminEntityId(
    contactMessageId,
    "identificador del mensaje de contacto"
  );

  return request(`/api/admin/contact-messages/${normalizedContactMessageId}/read`, {
    method: "PATCH",
  });
}

export function deleteAdminContactMessage(contactMessageId) {
  const normalizedContactMessageId = normalizeAdminEntityId(
    contactMessageId,
    "identificador del mensaje de contacto"
  );

  return request(`/api/admin/contact-messages/${normalizedContactMessageId}`, {
    method: "DELETE",
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

export function listMediaAssets(assetType = null) {
  const query = assetType ? `?asset_type=${encodeURIComponent(assetType)}` : "";
  return request(`/api/admin/media-assets${query}`);
}

export function uploadMediaAsset(payload, options = {}) {
  return request("/api/admin/media-assets", {
    ...options,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteMediaAsset(assetId) {
  return request(`/api/admin/media-assets/${assetId}`, {
    method: "DELETE",
  });
}

export function fetchAdminMediaBlob(contentUrl, options = {}) {
  if (!contentUrl) {
    throw new Error("No hay URL de contenido multimedia disponible.");
  }

  return requestBlob(contentUrl, options);
}
