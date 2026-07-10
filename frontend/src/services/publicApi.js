import { buildApiUrl } from "../utils/apiConfig";

const FIELD_LABELS = {
  name: "nombre",
  email: "correo electronico",
  subject: "asunto",
  message: "mensaje",
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

function buildHeaders(headers, body) {
  const finalHeaders = new Headers(headers || {});

  if (!finalHeaders.has("Content-Type") && shouldSetJsonContentType(body)) {
    finalHeaders.set("Content-Type", "application/json");
  }

  return finalHeaders;
}

function getFieldLabel(location) {
  if (!Array.isArray(location)) {
    return "formulario";
  }

  const fieldKey = [...location]
    .reverse()
    .find(
      (value) =>
        typeof value === "string" &&
        value !== "body" &&
        value !== "query" &&
        value !== "path"
    );

  if (!fieldKey) {
    return "formulario";
  }

  return FIELD_LABELS[fieldKey] || fieldKey.replaceAll("_", " ");
}

function normalizeValidationMessage(issue) {
  const fieldLabel = getFieldLabel(issue?.loc);
  const issueType = issue?.type || "";
  const rawMessage =
    typeof issue?.msg === "string"
      ? issue.msg.replace(/^Value error,\s*/i, "")
      : "";

  if (issueType.includes("missing")) {
    return `El campo ${fieldLabel} es obligatorio.`;
  }

  if (issueType.includes("string_too_short")) {
    const minLength = issue?.ctx?.min_length;

    if (typeof minLength === "number") {
      return `El campo ${fieldLabel} debe tener al menos ${minLength} caracteres.`;
    }

    return `El campo ${fieldLabel} es demasiado corto.`;
  }

  if (issueType.includes("string_too_long")) {
    const maxLength = issue?.ctx?.max_length;

    if (typeof maxLength === "number") {
      return `El campo ${fieldLabel} no puede superar ${maxLength} caracteres.`;
    }

    return `El campo ${fieldLabel} es demasiado largo.`;
  }

  if (fieldLabel === "correo electronico") {
    return "Ingresa un correo electronico valido.";
  }

  if (rawMessage) {
    return `${fieldLabel}: ${rawMessage}`;
  }

  return `Revisa el campo ${fieldLabel}.`;
}

function formatValidationDetails(detail) {
  if (!Array.isArray(detail) || detail.length === 0) {
    return "Revisa los datos ingresados e intenta nuevamente.";
  }

  return detail
    .map((issue) => normalizeValidationMessage(issue))
    .filter(Boolean)
    .join(" ");
}

function getDefaultStatusMessage(status) {
  switch (status) {
    case 400:
      return "La solicitud no pudo procesarse.";
    case 404:
      return "No se encontro la informacion solicitada.";
    case 422:
      return "Revisa los datos ingresados e intenta nuevamente.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "El servidor no pudo responder en este momento. Intenta nuevamente.";
    default:
      return "Error al consumir la API.";
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
  } else if (typeof payload?.detail === "string" && payload.detail.trim()) {
    userMessage = payload.detail.trim();
  } else if (typeof payload?.message === "string" && payload.message.trim()) {
    userMessage = payload.message.trim();
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

async function request(endpoint, options = {}) {
  const { headers, body, method = "GET", ...restOptions } = options;

  let response;

  try {
    response = await fetch(buildApiUrl(endpoint), {
      ...restOptions,
      method,
      headers: buildHeaders(headers, body),
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
        "No fue posible conectar con el servidor. Verifica tu conexion e intenta nuevamente.",
      userMessage:
        "No fue posible conectar con el servidor. Verifica tu conexion e intenta nuevamente.",
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    const errorPayload = await parseErrorPayload(response);
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

export function getHomeData(options = {}) {
  return request("/api/public/home", options);
}

export function getProfile(options = {}) {
  return request("/api/public/profile", options);
}

export function getSocialLinks(options = {}) {
  return request("/api/public/social-links", options);
}

export function getSkills(options = {}) {
  return request("/api/public/skills", options);
}

export function getProjects(options = {}) {
  return request("/api/public/projects", options);
}

export function getFeaturedProjects(options = {}) {
  return request("/api/public/projects/featured", options);
}

export function getExperience(options = {}) {
  return request("/api/public/experience", options);
}

export function getEducation(options = {}) {
  return request("/api/public/education", options);
}

export function getCertifications(options = {}) {
  return request("/api/public/certifications", options);
}

export function sendContactMessage(data, options = {}) {
  return request("/api/public/contact", {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}
