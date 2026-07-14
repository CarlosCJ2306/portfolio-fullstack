const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "192.168.80.10",
]);

export function getApiBaseUrl() {
  const rawValue = import.meta.env.VITE_API_BASE_URL;

  if (!rawValue) {
    throw new Error("No esta configurada la variable VITE_API_BASE_URL.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new Error("VITE_API_BASE_URL debe ser una URL absoluta valida.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("VITE_API_BASE_URL debe usar http o https.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("VITE_API_BASE_URL no debe contener credenciales.");
  }

  if (parsedUrl.protocol === "http:" && !LOCAL_HOSTS.has(parsedUrl.hostname)) {
    throw new Error("VITE_API_BASE_URL solo puede usar http en desarrollo local.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

export function buildApiUrl(path) {
  return `${getApiBaseUrl()}/${String(path).replace(/^\/+/, "")}`;
}
