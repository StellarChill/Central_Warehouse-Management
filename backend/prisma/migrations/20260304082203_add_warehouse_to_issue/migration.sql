/*
  Warnings:

  - Added the required column `WarehouseId` to the `Issue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "WarehouseId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "AdjustmentId" SERIAL NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "Reason" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("AdjustmentId")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "TransferId" SERIAL NOT NULL,
    "TransferCode" TEXT NOT NULL,
    "SourceWarehouseId" INTEGER NOT NULL,
    "TargetWarehouseId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "TransferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "Remark" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("TransferId")
);

-- CreateTable
CREATE TABLE "StockTransferDetail" (
    "TransferDetailId" SERIAL NOT NULL,
    "TransferId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,

    CONSTRAINT "StockTransferDetail_pkey" PRIMARY KEY ("TransferDetailId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_TransferCode_key" ON "StockTransfer"("TransferCode");

-- CreateIndex
CREATE INDEX "Issue_WarehouseId_idx" ON "Issue"("WarehouseId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_SourceWarehouseId_fkey" FOREIGN KEY ("SourceWarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_TargetWarehouseId_fkey" FOREIGN KEY ("TargetWarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferDetail" ADD CONSTRAINT "StockTransferDetail_TransferId_fkey" FOREIGN KEY ("TransferId") REFERENCES "StockTransfer"("TransferId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferDetail" ADD CONSTRAINT "StockTransferDetail_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferDetail" ADD CONSTRAINT "StockTransferDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;
