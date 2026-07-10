const rawApiBaseUrl = process.env.VITE_API_BASE_URL;

function fail(message) {
  console.error(`validate:production-env: ${message}`);
  process.exit(1);
}

if (!rawApiBaseUrl) {
  fail("VITE_API_BASE_URL es obligatoria.");
}

let parsedUrl;

try {
  parsedUrl = new URL(rawApiBaseUrl);
} catch {
  fail("VITE_API_BASE_URL debe ser una URL absoluta valida.");
}

if (parsedUrl.protocol !== "https:") {
  fail("VITE_API_BASE_URL debe usar https.");
}

if (["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
  fail("VITE_API_BASE_URL no debe apuntar a localhost.");
}

if (parsedUrl.username || parsedUrl.password) {
  fail("VITE_API_BASE_URL no debe contener credenciales.");
}

if (parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
  fail("VITE_API_BASE_URL no debe incluir path, query ni fragment.");
}

console.log("validate:production-env: ok");
