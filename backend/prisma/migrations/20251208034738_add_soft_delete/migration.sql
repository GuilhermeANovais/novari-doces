/*
  Warnings:

  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
