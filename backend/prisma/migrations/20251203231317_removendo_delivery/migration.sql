/*
  Warnings:

  - You are about to drop the column `deliveryDate` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sector` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `DeliveryInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeliveryInventory" DROP CONSTRAINT "DeliveryInventory_productId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryDate";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "sector";

-- DropTable
DROP TABLE "DeliveryInventory";

-- DropEnum
DROP TYPE "Sector";
