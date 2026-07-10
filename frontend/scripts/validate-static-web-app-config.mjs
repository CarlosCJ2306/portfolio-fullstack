import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const rootDir = resolve(import.meta.dirname, "..");
const publicConfigPath = resolve(rootDir, "public", "staticwebapp.config.json");
const distConfigPath = resolve(rootDir, "dist", "staticwebapp.config.json");
const activeWorkflowDir = resolve(rootDir, "..", ".github", "workflows");
const workflowTemplatePath = resolve(
  rootDir,
  "..",
  "docs",
  "deployment",
  "azure-static-web-apps.workflow.yml.example"
);

function fail(message) {
  console.error(`validate:azure-static-config: ${message}`);
  process.exit(1);
}

function readText(path) {
  if (!existsSync(path)) {
    fail(`No existe ${path}`);
  }

  return readFileSync(path, "utf8");
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch {
    fail(`JSON invalido en ${path}`);
  }
}

function assertNoForbiddenText(text, source) {
  const forbiddenPatterns = [
    /azurewebsites\.net/i,
    /staticapps\.net/i,
    /Access-Control-Allow-Origin/i,
    /AZURE_STATIC_WEB_APPS_API_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_\-.]{10,}/i,
    /deployment[_-]?token\s*[:=]\s*['"]?[A-Za-z0-9_\-.]{10,}/i,
    /Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/i,
    /Basic\s+[A-Za-z0-9+/=]{12,}/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      fail(`Valor no permitido en ${source}.`);
    }
  }
}

function validateStaticWebAppConfig(path) {
  const rawText = readText(path);
  const config = readJson(path);

  assertNoForbiddenText(rawText, path);

  if (config.apiRuntime) {
    fail("staticwebapp.config.json no debe declarar apiRuntime.");
  }

  if (!config.navigationFallback) {
    fail("Falta navigationFallback.");
  }

  if (config.navigationFallback.rewrite !== "/index.html") {
    fail("navigationFallback.rewrite debe ser /index.html.");
  }

  const excludes = config.navigationFallback.exclude || [];

  if (!Array.isArray(excludes) || !excludes.includes("/assets/*")) {
    fail("navigationFallback debe excluir /assets/*.");
  }

  const globalHeaders = config.globalHeaders || {};

  if (globalHeaders["X-Content-Type-Options"] !== "nosniff") {
    fail("X-Content-Type-Options debe ser nosniff.");
  }

  if ("Access-Control-Allow-Origin" in globalHeaders) {
    fail("CORS no debe configurarse en Static Web Apps.");
  }

  const adminRoute = (config.routes || []).find((route) => route.route === "/admin");

  if (adminRoute?.allowedRoles) {
    fail("/admin no debe usar allowedRoles en Static Web Apps.");
  }

  return true;
}

function validateWorkflowTemplate() {
  if (!existsSync(workflowTemplatePath)) {
    fail("Falta plantilla de workflow en docs/deployment.");
  }

  const text = readText(workflowTemplatePath);
  assertNoForbiddenText(text, workflowTemplatePath);

  const requiredSnippets = [
    'app_location: "frontend"',
    'api_location: ""',
    'output_location: "dist"',
    'app_build_command: "npm run build:azure"',
    "secrets.AZURE_STATIC_WEB_APPS_API_TOKEN",
    "vars.VITE_API_BASE_URL",
    "secrets.GITHUB_TOKEN",
  ];

  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) {
      fail(`La plantilla no contiene ${snippet}.`);
    }
  }

  if (existsSync(activeWorkflowDir)) {
    const activeWorkflowFiles = readdirSync(activeWorkflowDir).filter((fileName) =>
      /\.(ya?ml)$/i.test(fileName)
    );

    for (const fileName of activeWorkflowFiles) {
      const workflowPath = resolve(activeWorkflowDir, fileName);
      const workflowText = readText(workflowPath);

      if (/Azure\/static-web-apps-deploy@v1/i.test(workflowText)) {
        fail("No debe existir un workflow activo de Azure Static Web Apps en .github/workflows.");
      }
    }
  }
}

if (existsSync(resolve(rootDir, "public", "routes.json"))) {
  fail("routes.json esta deprecado y no debe existir.");
}

validateStaticWebAppConfig(publicConfigPath);
validateWorkflowTemplate();

if (args.has("--dist")) {
  validateStaticWebAppConfig(distConfigPath);
}

console.log("validate:azure-static-config: ok");
