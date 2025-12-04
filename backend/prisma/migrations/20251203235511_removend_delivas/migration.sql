-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockDelivery" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockKitchen" INTEGER NOT NULL DEFAULT 0;
