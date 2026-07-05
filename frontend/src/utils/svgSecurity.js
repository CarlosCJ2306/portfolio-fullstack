const FORBIDDEN_SVG_ELEMENTS = new Set([
  "a",
  "animate",
  "animatemotion",
  "animatetransform",
  "audio",
  "canvas",
  "discard",
  "embed",
  "feimage",
  "foreignobject",
  "handler",
  "iframe",
  "image",
  "link",
  "listener",
  "mpath",
  "object",
  "script",
  "set",
  "style",
  "video",
]);

const ALLOWED_ELEMENT_NAMESPACES = new Set([
  null,
  "",
  "http://www.w3.org/2000/svg",
]);

const ALLOWED_ATTRIBUTE_NAMESPACES = new Set([
  null,
  "",
  "http://www.w3.org/1999/xlink",
  "http://www.w3.org/XML/1998/namespace",
]);

const LOCAL_URL_PATTERN = /url\(\s*['"]?#[A-Za-z_][\w:.-]*['"]?\s*\)/gi;

function hasUnsafeUrl(value) {
  const normalizedValue = Array.from(value)
    .filter((character) => {
      const characterCode = character.charCodeAt(0);
      return characterCode > 32 && characterCode !== 127;
    })
    .join("")
    .toLowerCase();

  if (
    normalizedValue.includes("javascript:")
    || normalizedValue.includes("vbscript:")
    || normalizedValue.includes("data:")
  ) {
    return true;
  }

  return value.replace(LOCAL_URL_PATTERN, "").toLowerCase().includes("url(");
}

export function isSafeSvgContent(svgContent) {
  if (typeof svgContent !== "string" || !svgContent.trim()) {
    return false;
  }

  const normalizedSvgContent = svgContent.trim();
  const loweredSvgContent = normalizedSvgContent.toLowerCase();

  if (
    loweredSvgContent.includes("<!doctype")
    || loweredSvgContent.includes("<!entity")
  ) {
    return false;
  }

  const contentWithoutXmlDeclaration = normalizedSvgContent.replace(
    /^\s*<\?xml\s+[^?]*\?>/i,
    ""
  );

  if (contentWithoutXmlDeclaration.includes("<?")) {
    return false;
  }

  if (typeof DOMParser === "undefined") {
    return false;
  }

  const documentNode = new DOMParser().parseFromString(
    normalizedSvgContent,
    "image/svg+xml"
  );
  const root = documentNode.documentElement;

  if (
    !root
    || root.localName.toLowerCase() !== "svg"
    || !ALLOWED_ELEMENT_NAMESPACES.has(root.namespaceURI)
    || documentNode.querySelector("parsererror")
  ) {
    return false;
  }

  const elements = [root, ...root.querySelectorAll("*")];

  for (const element of elements) {
    const elementName = element.localName.toLowerCase();

    if (
      !ALLOWED_ELEMENT_NAMESPACES.has(element.namespaceURI)
      || FORBIDDEN_SVG_ELEMENTS.has(elementName)
    ) {
      return false;
    }

    for (const attribute of element.attributes) {
      const attributeName = attribute.localName.toLowerCase();

      if (!ALLOWED_ATTRIBUTE_NAMESPACES.has(attribute.namespaceURI)) {
        return false;
      }

      if (
        attributeName.startsWith("on")
        || attributeName === "style"
        || attributeName === "base"
        || hasUnsafeUrl(attribute.value)
      ) {
        return false;
      }

      if (
        (attributeName === "href" || attributeName === "src")
        && attribute.value.trim()
        && !attribute.value.trim().startsWith("#")
      ) {
        return false;
      }
    }
  }

  return true;
}

export function validateSafeSvgContent(svgContent) {
  if (!isSafeSvgContent(svgContent)) {
    throw new Error(
      "El SVG contiene scripts, eventos, referencias externas u otro contenido no permitido."
    );
  }

  return svgContent.trim();
}

export function getSafeSvgDataUrl(svgContent) {
  if (!isSafeSvgContent(svgContent)) {
    return null;
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
}
