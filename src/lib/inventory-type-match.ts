/**
 * "Mode B" service inventory requirements (§9): a requirement can target an `InventoryType` plus
 * structured `matchCriteria` instead of an exact item. At booking time the system searches for
 * eligible items of that type whose `attributes` satisfy every criterion (e.g. `shape = ROUND` and
 * `seatingCapacity >= 10`). Pure — no DB access.
 */

import type { AttributeDef } from './inventory-attributes';

/** A single criterion: an exact value, or a numeric range / set membership. */
export type CriterionValue =
  | string
  | number
  | boolean
  | { gte?: number; lte?: number; in?: string[] };

export type MatchCriteria = Record<string, CriterionValue>;

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validates submitted `matchCriteria` against a type's `attributeDefs` (used by the services API):
 * every key must be a defined attribute; range operators (`gte`/`lte`) only on `number` attributes;
 * `in` / string / boolean values must be consistent with the attribute's type and options.
 */
export function validateMatchCriteria(raw: unknown, defs: AttributeDef[]): Ok<{ criteria: MatchCriteria }> | Err {
  if (raw == null) return { ok: true, criteria: {} };
  if (!isPlainObject(raw)) return { ok: false, error: 'Match criteria must be an object.' };

  const defByKey = new Map(defs.map((d) => [d.key, d]));
  const criteria: MatchCriteria = {};

  for (const [key, value] of Object.entries(raw)) {
    const def = defByKey.get(key);
    if (!def) return { ok: false, error: `Match criterion "${key}" is not an attribute of this type.` };

    if (isPlainObject(value)) {
      const range = value as { gte?: unknown; lte?: unknown; in?: unknown };
      const hasRange = range.gte !== undefined || range.lte !== undefined;
      const hasIn = range.in !== undefined;
      if (hasRange && def.type !== 'number') {
        return { ok: false, error: `Criterion "${key}": gte/lte only apply to number attributes.` };
      }
      if (hasRange) {
        if (range.gte !== undefined && (typeof range.gte !== 'number' || !Number.isFinite(range.gte))) {
          return { ok: false, error: `Criterion "${key}": "gte" must be a number.` };
        }
        if (range.lte !== undefined && (typeof range.lte !== 'number' || !Number.isFinite(range.lte))) {
          return { ok: false, error: `Criterion "${key}": "lte" must be a number.` };
        }
      }
      if (hasIn) {
        if (!Array.isArray(range.in) || range.in.length === 0 || !range.in.every((v) => typeof v === 'string')) {
          return { ok: false, error: `Criterion "${key}": "in" must be a non-empty string array.` };
        }
        if (def.options && !(range.in as string[]).every((v) => def.options!.includes(v))) {
          return { ok: false, error: `Criterion "${key}": "in" contains values not in the attribute's options.` };
        }
      }
      if (!hasRange && !hasIn) return { ok: false, error: `Criterion "${key}": empty operator object.` };
      criteria[key] = {
        ...(range.gte !== undefined ? { gte: range.gte as number } : {}),
        ...(range.lte !== undefined ? { lte: range.lte as number } : {}),
        ...(hasIn ? { in: range.in as string[] } : {}),
      };
      continue;
    }

    if (typeof value === 'number') {
      if (def.type !== 'number') return { ok: false, error: `Criterion "${key}": expected a ${def.type} value.` };
      criteria[key] = value;
    } else if (typeof value === 'boolean') {
      if (def.type !== 'boolean') return { ok: false, error: `Criterion "${key}": expected a ${def.type} value.` };
      criteria[key] = value;
    } else if (typeof value === 'string') {
      if (def.type !== 'text' && def.type !== 'textarea' && def.type !== 'select' && def.type !== 'multiselect' && def.type !== 'date') {
        return { ok: false, error: `Criterion "${key}": expected a ${def.type} value.` };
      }
      if (def.options && !def.options.includes(value)) {
        return { ok: false, error: `Criterion "${key}": "${value}" is not one of the attribute's options.` };
      }
      criteria[key] = value;
    } else {
      return { ok: false, error: `Criterion "${key}": unsupported value.` };
    }
  }

  return { ok: true, criteria };
}

/**
 * Does an item's `attributes` satisfy every criterion? `null`/empty criteria always match. A
 * missing attribute fails any criterion for it. `multiselect` attributes match an exact string /
 * `in` criterion if the array *contains* the value(s).
 */
export function itemMatchesCriteria(attributes: unknown, criteria: MatchCriteria | null | undefined): boolean {
  if (!criteria || Object.keys(criteria).length === 0) return true;
  const attrs = isPlainObject(attributes) ? attributes : {};

  for (const [key, crit] of Object.entries(criteria)) {
    const actual = attrs[key];
    if (actual === undefined || actual === null) return false;

    if (isPlainObject(crit)) {
      const n = Number(actual);
      if (crit.gte !== undefined) {
        if (!Number.isFinite(n) || n < crit.gte) return false;
      }
      if (crit.lte !== undefined) {
        if (!Number.isFinite(n) || n > crit.lte) return false;
      }
      if (crit.in !== undefined) {
        const ok = Array.isArray(actual)
          ? actual.some((v) => crit.in!.includes(String(v)))
          : crit.in.includes(String(actual));
        if (!ok) return false;
      }
      continue;
    }

    if (typeof crit === 'number') {
      if (Number(actual) !== crit) return false;
    } else if (typeof crit === 'boolean') {
      if (actual !== crit) return false;
    } else {
      // string criterion
      const ok = Array.isArray(actual) ? actual.map(String).includes(crit) : String(actual) === crit;
      if (!ok) return false;
    }
  }

  return true;
}
