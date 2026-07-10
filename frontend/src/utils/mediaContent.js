const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function joinUrl(baseUrl, path) {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function resolveMediaContentUrl(asset) {
  const contentUrl =
    typeof asset === "string" ? asset : asset?.content_url || "";

  if (!contentUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(contentUrl);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    // Las rutas relativas se resuelven contra VITE_API_BASE_URL.
  }

  return joinUrl(API_BASE_URL, contentUrl);
}

export function buildLegacyAssetDataUrl(asset) {
  if (!asset?.data_base64 || !asset?.mime_type) {
    return "";
  }

  if (asset.data_base64.startsWith("data:")) {
    return asset.data_base64;
  }

  return `data:${asset.mime_type};base64,${asset.data_base64}`;
}
