import assert from "node:assert/strict";

import { normalizeAdminEntityId } from "../src/utils/adminEntityIds.js";

const FIELD_LABEL = "identificador del mensaje de contacto";

assert.equal(normalizeAdminEntityId(1, FIELD_LABEL), 1);
assert.equal(normalizeAdminEntityId("2", FIELD_LABEL), 2);
assert.equal(normalizeAdminEntityId(" 3 ", FIELD_LABEL), 3);

for (const invalidValue of [
  undefined,
  null,
  "",
  "   ",
  "abc",
  "1.5",
  0,
  -1,
  1.5,
  { id: 1 },
]) {
  assert.throws(
    () => normalizeAdminEntityId(invalidValue, FIELD_LABEL),
    /mensaje de contacto.*entero válido/
  );
}

console.log("Validación de IDs de mensajes admin aprobada.");
