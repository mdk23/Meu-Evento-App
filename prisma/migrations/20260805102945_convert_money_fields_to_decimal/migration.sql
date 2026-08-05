-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "event_services" ALTER COLUMN "sellingPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "supplierCost" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "payment_transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "scheduled_payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "defaultPrice" SET DATA TYPE DECIMAL(12,2);
