-- Fuller resource lifecycle (prompt-2 §18/§19/§26): CONFIRMED and ISSUED between RESERVED and
-- IN_USE, and an ISSUE movement type so "issued" is derivable from the ledger the way "allocated"
-- already is. DAMAGE / LOSS movement types already exist.
--
-- Enum-only migration: `ALTER TYPE ... ADD VALUE` cannot be used in the same transaction that then
-- writes it, so this file has no table DDL and no data writes. Existing rows keep their current
-- labels (RESERVED/IN_USE/etc.) unchanged.
ALTER TYPE "ResourceAllocationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED' AFTER 'RESERVED';
ALTER TYPE "ResourceAllocationStatus" ADD VALUE IF NOT EXISTS 'ISSUED' AFTER 'CONFIRMED';
ALTER TYPE "InventoryTransactionType" ADD VALUE IF NOT EXISTS 'ISSUE' AFTER 'ALLOCATE';
