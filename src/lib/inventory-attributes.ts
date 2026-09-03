/**
 * Dynamic inventory-attribute schema (§3/§14/§16 of the Category → Type → Item spec).
 *
 * An `InventoryType` owns an `attributeDefs` JSON array describing which characteristics its items
 * carry; each `InventoryItem` stores matching values in `attributes`. These are the server-side
 * authoritative validators — the frontend uses the same conceptual shape but is never trusted.
 * Pure — no DB access.
 */

export const ATTRIBUTE_TYPES = ['text', 'textarea', 'number', 'select', 'multiselect', 'boolean', 'date'] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export interface AttributeDef {
  key: string;
  label: string;
  type: AttributeType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

/** A machine-safe attribute key: a letter first, then letters/digits/underscore (camelCase allowed,
 * e.g. `seatingCapacity`). No spaces, no leading digit, no punctuation. */
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validates a type's `attributeDefs` JSON. Enforces: array of objects; each has string
 * `key`/`label`, a known `type`, boolean `required`; keys machine-safe (`/^[a-z][a-z0-9_]*$/`) and
 * unique; `select`/`multiselect` carry a non-empty `options[]` with no duplicates; `min <= max`
 * when both are numbers.
 */
export function validateAttributeDefs(raw: unknown): Ok<{ defs: AttributeDef[] }> | Err {
  if (!Array.isArray(raw)) return { ok: false, error: 'Attribute definitions must be an array.' };

  const seen = new Set<string>();
  const defs: AttributeDef[] = [];

  for (let i = 0; i < raw.length; i++) {
    const d = raw[i];
    const where = `Attribute #${i + 1}`;
    if (!isPlainObject(d)) return { ok: false, error: `${where} must be an object.` };

    const key = d.key;
    if (typeof key !== 'string' || !KEY_RE.test(key)) {
      return { ok: false, error: `${where}: "key" must be machine-safe (a letter then letters/digits/_, e.g. "seatingCapacity").` };
    }
    if (seen.has(key)) return { ok: false, error: `Duplicate attribute key "${key}".` };
    seen.add(key);

    const label = d.label;
    if (typeof label !== 'string' || label.trim() === '') {
      return { ok: false, error: `Attribute "${key}": "label" is required.` };
    }

    const type = d.type;
    if (typeof type !== 'string' || !ATTRIBUTE_TYPES.includes(type as AttributeType)) {
      return { ok: false, error: `Attribute "${key}": unknown type "${String(type)}".` };
    }

    if (typeof d.required !== 'boolean') {
      return { ok: false, error: `Attribute "${key}": "required" must be a boolean.` };
    }

    const def: AttributeDef = { key, label, type: type as AttributeType, required: d.required };

    if (type === 'select' || type === 'multiselect') {
      const options = d.options;
      if (!Array.isArray(options) || options.length === 0 || !options.every((o) => typeof o === 'string')) {
        return { ok: false, error: `Attribute "${key}": ${type} needs a non-empty string "options" array.` };
      }
      if (new Set(options).size !== options.length) {
        return { ok: false, error: `Attribute "${key}": "options" has duplicates.` };
      }
      def.options = options as string[];
    }

    if (type === 'number') {
      if (d.min !== undefined) {
        if (typeof d.min !== 'number' || !Number.isFinite(d.min)) {
          return { ok: false, error: `Attribute "${key}": "min" must be a number.` };
        }
        def.min = d.min;
      }
      if (d.max !== undefined) {
        if (typeof d.max !== 'number' || !Number.isFinite(d.max)) {
          return { ok: false, error: `Attribute "${key}": "max" must be a number.` };
        }
        def.max = d.max;
      }
      if (def.min !== undefined && def.max !== undefined && def.min > def.max) {
        return { ok: false, error: `Attribute "${key}": "min" is greater than "max".` };
      }
    }

    defs.push(def);
  }

  return { ok: true, defs };
}

/**
 * Parses a stored `InventoryType.attributeDefs` value into `AttributeDef[]`, returning `[]` on
 * anything malformed (read-side leniency — the write path is where bad defs are rejected).
 */
export function readAttributeDefs(raw: unknown): AttributeDef[] {
  const res = validateAttributeDefs(raw);
  return res.ok ? res.defs : [];
}

/**
 * Validates an item's submitted `attributes` against its type's defs and returns only the validated
 * keys (§14). Rejects: missing required; unknown keys; wrong value type; out-of-range numbers;
 * select/multiselect values not in `options`.
 */
export function validateAttributeValues(
  raw: unknown,
  defs: AttributeDef[]
): Ok<{ values: Record<string, unknown> }> | Err {
  const input = raw == null ? {} : raw;
  if (!isPlainObject(input)) return { ok: false, error: 'Attributes must be an object.' };

  const defByKey = new Map(defs.map((d) => [d.key, d]));

  for (const k of Object.keys(input)) {
    if (!defByKey.has(k)) return { ok: false, error: `Unknown attribute "${k}" for this type.` };
  }

  const values: Record<string, unknown> = {};

  for (const def of defs) {
    const present = Object.prototype.hasOwnProperty.call(input, def.key);
    const value = present ? input[def.key] : undefined;
    const empty = value === undefined || value === null || value === '';

    if (empty) {
      if (def.required) return { ok: false, error: `Attribute "${def.key}" is required.` };
      continue;
    }

    switch (def.type) {
      case 'text':
      case 'textarea': {
        if (typeof value !== 'string') return { ok: false, error: `Attribute "${def.key}" must be text.` };
        values[def.key] = value;
        break;
      }
      case 'number': {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return { ok: false, error: `Attribute "${def.key}" must be a number.` };
        if (def.min !== undefined && n < def.min) return { ok: false, error: `Attribute "${def.key}" must be ≥ ${def.min}.` };
        if (def.max !== undefined && n > def.max) return { ok: false, error: `Attribute "${def.key}" must be ≤ ${def.max}.` };
        values[def.key] = n;
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean') return { ok: false, error: `Attribute "${def.key}" must be true or false.` };
        values[def.key] = value;
        break;
      }
      case 'select': {
        if (typeof value !== 'string' || !(def.options ?? []).includes(value)) {
          return { ok: false, error: `Attribute "${def.key}": "${String(value)}" is not an allowed option.` };
        }
        values[def.key] = value;
        break;
      }
      case 'multiselect': {
        if (!Array.isArray(value) || !value.every((v) => typeof v === 'string' && (def.options ?? []).includes(v))) {
          return { ok: false, error: `Attribute "${def.key}": one or more values are not allowed options.` };
        }
        if (new Set(value).size !== value.length) {
          return { ok: false, error: `Attribute "${def.key}" has duplicate values.` };
        }
        values[def.key] = value;
        break;
      }
      case 'date': {
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          return { ok: false, error: `Attribute "${def.key}" must be an ISO date string.` };
        }
        values[def.key] = value;
        break;
      }
    }
  }

  return { ok: true, values };
}

/**
 * Reads `seatingCapacity` from an item's `attributes` — but ONLY when the item's type actually
 * defines a numeric `seatingCapacity` attribute (§10: "verify that the selected Type defines the
 * relevant characteristic"). Returns 0 otherwise, so non-seating items never accidentally count.
 */
export function getSeatingCapacity(attributes: unknown, defs: AttributeDef[]): number {
  const def = defs.find((d) => d.key === 'seatingCapacity');
  if (!def || def.type !== 'number') return 0;
  if (!isPlainObject(attributes)) return 0;
  const n = Number(attributes.seatingCapacity);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
