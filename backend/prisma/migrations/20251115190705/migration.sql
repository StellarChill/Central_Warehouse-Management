/*
  Warnings:

  - Added the required column `CompanyId` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Catagory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `IssueDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `PurchaseOrderDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `ReceiptDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `WarehouseId` to the `ReceiptDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `WarehouseId` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `UserStatus` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `CompanyId` to the `WithdrawnRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CompanyId` to the `WithdrawnRequestDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Catagory" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "IssueDetail" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderDetail" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ReceiptDetail" ADD COLUMN     "CompanyId" INTEGER NOT NULL,
ADD COLUMN     "WarehouseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "CompanyId" INTEGER NOT NULL,
ADD COLUMN     "WarehouseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "CompanyId" INTEGER NOT NULL,
ALTER COLUMN "UserStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "WithdrawnRequest" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "WithdrawnRequestDetail" ADD COLUMN     "CompanyId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Company" (
    "CompanyId" SERIAL NOT NULL,
    "CompanyName" TEXT NOT NULL,
    "CompanyAddress" TEXT,
    "TaxId" TEXT,
    "CompanyCode" TEXT NOT NULL,
    "CompanyTelNumber" TEXT,
    "CompanyEmail" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("CompanyId")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "WarehouseId" SERIAL NOT NULL,
    "WarehouseName" TEXT NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "WarehouseAddress" TEXT,
    "WarehouseCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("WarehouseId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_CompanyCode_key" ON "Company"("CompanyCode");

-- CreateIndex
CREATE INDEX "Company_CompanyName_idx" ON "Company"("CompanyName");

-- CreateIndex
CREATE INDEX "Company_CompanyCode_idx" ON "Company"("CompanyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_WarehouseCode_key" ON "Warehouse"("WarehouseCode");

-- CreateIndex
CREATE INDEX "Warehouse_WarehouseName_idx" ON "Warehouse"("WarehouseName");

-- CreateIndex
CREATE INDEX "Warehouse_CompanyId_idx" ON "Warehouse"("CompanyId");

-- CreateIndex
CREATE INDEX "Warehouse_WarehouseCode_idx" ON "Warehouse"("WarehouseCode");

-- CreateIndex
CREATE INDEX "Branch_CompanyId_idx" ON "Branch"("CompanyId");

-- CreateIndex
CREATE INDEX "Catagory_CompanyId_idx" ON "Catagory"("CompanyId");

-- CreateIndex
CREATE INDEX "Issue_CompanyId_idx" ON "Issue"("CompanyId");

-- CreateIndex
CREATE INDEX "IssueDetail_CompanyId_idx" ON "IssueDetail"("CompanyId");

-- CreateIndex
CREATE INDEX "Material_CompanyId_idx" ON "Material"("CompanyId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_CompanyId_idx" ON "PurchaseOrder"("CompanyId");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_CompanyId_idx" ON "PurchaseOrderDetail"("CompanyId");

-- CreateIndex
CREATE INDEX "Receipt_CompanyId_idx" ON "Receipt"("CompanyId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_CompanyId_idx" ON "ReceiptDetail"("CompanyId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_WarehouseId_idx" ON "ReceiptDetail"("WarehouseId");

-- CreateIndex
CREATE INDEX "Stock_CompanyId_idx" ON "Stock"("CompanyId");

-- CreateIndex
CREATE INDEX "Stock_WarehouseId_idx" ON "Stock"("WarehouseId");

-- CreateIndex
CREATE INDEX "Supplier_CompanyId_idx" ON "Supplier"("CompanyId");

-- CreateIndex
CREATE INDEX "User_CompanyId_idx" ON "User"("CompanyId");

-- CreateIndex
CREATE INDEX "WithdrawnRequest_CompanyId_idx" ON "WithdrawnRequest"("CompanyId");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_CompanyId_idx" ON "WithdrawnRequestDetail"("CompanyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catagory" ADD CONSTRAINT "Catagory_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequest" ADD CONSTRAINT "WithdrawnRequest_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;
