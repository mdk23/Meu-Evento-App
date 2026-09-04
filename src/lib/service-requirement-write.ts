/**
 * Server-side resolution for a Service's inventory-requirement list (Mode A: exact item, Mode B:
 * `inventoryType` + `matchCriteria`). Verifies every referenced type belongs to the tenant (§12) and
 * validates each `matchCriteria` against that type's `attributeDefs`. Used by both
 * `POST /api/services` and `PATCH /api/services/[id]` before the delete-then-recreate write.
 */

import { prisma } from '@/lib/prisma';
import { readAttributeDefs } from '@/lib/inventory-attributes';
import { validateMatchCriteria, type MatchCriteria } from '@/lib/inventory-type-match';

export interface RawServiceRequirement {
  inventoryItemId?: string | null;
  inventoryTypeId?: string | null;
  matchCriteria?: unknown;
  quantity?: number | string;
  quantityType?: string;
  optional?: boolean;
  notes?: string | null;
}

export interface ResolvedServiceRequirement {
  inventoryItemId: string | null;
  inventoryTypeId: string | null;
  matchCriteria: MatchCriteria | null;
  quantity: number | string | undefined;
  quantityType: string | undefined;
  optional: boolean;
  notes: string | null;
}

function isEmptyObject(v: unknown): boolean {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v as object).length === 0;
}

export async function resolveServiceRequirements(
  tenantId: string,
  raw: unknown,
): Promise<{ ok: true; rows: ResolvedServiceRequirement[] } | { ok: false; error: string }> {
  if (!Array.isArray(raw)) return { ok: true, rows: [] };
  const rows = raw as RawServiceRequirement[];

  const typeIds = Array.from(new Set(rows.map((r) => r.inventoryTypeId).filter((x): x is string => !!x)));
  const types = typeIds.length
    ? await prisma.inventoryType.findMany({
        where: { id: { in: typeIds } },
        select: { id: true, tenantId: true, attributeDefs: true },
      })
    : [];
  const typeById = new Map(types.map((t) => [t.id, t]));

  const out: ResolvedServiceRequirement[] = [];
  for (const r of rows) {
    if (!r.inventoryItemId && !r.inventoryTypeId) {
      return { ok: false, error: 'Each inventory requirement needs either a specific item or a type.' };
    }
    if (r.quantityType === 'GUESTS_PER_UNIT' && !(parseFloat(String(r.quantity ?? 0)) > 0)) {
      return { ok: false, error: 'Guests-per-unit requirements need a seats-per-unit value greater than zero.' };
    }

    let matchCriteria: MatchCriteria | null = null;
    if (r.inventoryTypeId) {
      const type = typeById.get(r.inventoryTypeId);
      if (!type || type.tenantId !== tenantId) {
        return { ok: false, error: 'Referenced inventory type was not found for this tenant.' };
      }
      if (r.matchCriteria != null && !isEmptyObject(r.matchCriteria)) {
        const v = validateMatchCriteria(r.matchCriteria, readAttributeDefs(type.attributeDefs));
        if (!v.ok) return { ok: false, error: v.error };
        matchCriteria = v.criteria;
      }
    }

    out.push({
      inventoryItemId: r.inventoryItemId || null,
      inventoryTypeId: r.inventoryTypeId || null,
      matchCriteria,
      quantity: r.quantity,
      quantityType: r.quantityType,
      optional: !!r.optional,
      notes: r.notes ?? null,
    });
  }

  return { ok: true, rows: out };
}
