-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "CompanyStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "TempCompanyId" INTEGER,
ADD COLUMN     "UserStatusActive" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "UserStatusApprove" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "TempCompany" (
    "TempCompanyId" SERIAL NOT NULL,
    "TempCompanyName" TEXT NOT NULL,
    "TempCompanyAddress" TEXT,
    "TempCompanyTaxId" TEXT,
    "TempCompanyCode" TEXT NOT NULL,
    "TempCompanyTelNumber" TEXT,
    "TempCompanyEmail" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "TempCompany_pkey" PRIMARY KEY ("TempCompanyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempCompany_TempCompanyCode_key" ON "TempCompany"("TempCompanyCode");

-- CreateIndex
CREATE INDEX "TempCompany_TempCompanyName_idx" ON "TempCompany"("TempCompanyName");

-- CreateIndex
CREATE INDEX "TempCompany_TempCompanyCode_idx" ON "TempCompany"("TempCompanyCode");

-- CreateIndex
CREATE INDEX "Company_CompanyStatus_idx" ON "Company"("CompanyStatus");

-- CreateIndex
CREATE INDEX "User_TempCompanyId_idx" ON "User"("TempCompanyId");

-- CreateIndex
CREATE INDEX "User_UserStatusApprove_idx" ON "User"("UserStatusApprove");

-- CreateIndex
CREATE INDEX "User_UserStatusActive_idx" ON "User"("UserStatusActive");

-- AddForeignKey
ALTER TABLE "TempCompany" ADD CONSTRAINT "TempCompany_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempCompany" ADD CONSTRAINT "TempCompany_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_TempCompanyId_fkey" FOREIGN KEY ("TempCompanyId") REFERENCES "TempCompany"("TempCompanyId") ON DELETE SET NULL ON UPDATE CASCADE;
