export function normalizeAdminEntityId(value, fieldLabel = "identificador") {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new TypeError(`El ${fieldLabel} debe ser un número entero válido.`);
  }

  return numericValue;
}
