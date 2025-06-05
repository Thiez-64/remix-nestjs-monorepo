/*
  Warnings:

  - You are about to drop the `ActionTank` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActionTank" DROP CONSTRAINT "ActionTank_tankId_fkey";

-- DropForeignKey
ALTER TABLE "ActionTank" DROP CONSTRAINT "ActionTank_userId_fkey";

-- DropTable
DROP TABLE "ActionTank";

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "needsPurchase" BOOLEAN NOT NULL DEFAULT false,
    "wineType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionConsumable" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionConsumable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Action_userId_idx" ON "Action"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Consumable_name_unit_key" ON "Consumable"("name", "unit");

-- CreateIndex
CREATE INDEX "ActionConsumable_actionId_idx" ON "ActionConsumable"("actionId");

-- CreateIndex
CREATE INDEX "ActionConsumable_consumableId_idx" ON "ActionConsumable"("consumableId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionConsumable_actionId_consumableId_key" ON "ActionConsumable"("actionId", "consumableId");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionConsumable" ADD CONSTRAINT "ActionConsumable_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionConsumable" ADD CONSTRAINT "ActionConsumable_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
