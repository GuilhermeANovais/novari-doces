-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
