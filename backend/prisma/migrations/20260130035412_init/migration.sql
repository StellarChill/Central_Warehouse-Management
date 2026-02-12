-- CreateTable
CREATE TABLE "Company" (
    "CompanyId" SERIAL NOT NULL,
    "CompanyName" TEXT NOT NULL,
    "CompanyAddress" TEXT,
    "TaxId" TEXT,
    "CompanyCode" TEXT NOT NULL,
    "CompanyTelNumber" TEXT,
    "CompanyEmail" TEXT,
    "CompanyStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("CompanyId")
);

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

-- CreateTable
CREATE TABLE "User" (
    "UserId" SERIAL NOT NULL,
    "UserName" TEXT NOT NULL,
    "UserStatusApprove" TEXT NOT NULL DEFAULT 'PENDING',
    "UserStatusActive" TEXT NOT NULL DEFAULT 'ACTIVE',
    "RequestedRoleText" TEXT,
    "UserPassword" TEXT NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "BranchId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "TempCompanyId" INTEGER,
    "TelNumber" TEXT,
    "Email" TEXT,
    "LineId" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserId")
);

-- CreateTable
CREATE TABLE "Branch" (
    "BranchId" SERIAL NOT NULL,
    "BranchName" TEXT NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "BranchAddress" TEXT,
    "BranchCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("BranchId")
);

-- CreateTable
CREATE TABLE "PurchaseOrderDetail" (
    "PurchaseOrderDetailId" SERIAL NOT NULL,
    "PurchaseOrderId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "PurchaseOrderQuantity" INTEGER NOT NULL,
    "PurchaseOrderPrice" DOUBLE PRECISION NOT NULL,
    "PurchaseOrderUnit" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "PurchaseOrderDetail_pkey" PRIMARY KEY ("PurchaseOrderDetailId")
);

-- CreateTable
CREATE TABLE "Role" (
    "RoleId" SERIAL NOT NULL,
    "RoleName" TEXT NOT NULL,
    "RoleCode" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("RoleId")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "SupplierId" SERIAL NOT NULL,
    "SupplierName" TEXT NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "SupplierAddress" TEXT,
    "SupplierCode" TEXT NOT NULL,
    "SupplierTelNumber" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("SupplierId")
);

-- CreateTable
CREATE TABLE "Material" (
    "MaterialId" SERIAL NOT NULL,
    "MaterialName" TEXT NOT NULL,
    "Unit" TEXT NOT NULL,
    "Price" DOUBLE PRECISION NOT NULL,
    "CatagoryId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "MaterialCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("MaterialId")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "PurchaseOrderId" SERIAL NOT NULL,
    "DateTime" TIMESTAMP(3) NOT NULL,
    "TotalPrice" DOUBLE PRECISION NOT NULL,
    "SupplierId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "PurchaseOrderCode" TEXT NOT NULL,
    "PurchaseOrderStatus" TEXT NOT NULL,
    "PurchaseOrderAddress" TEXT,
    "ContactName" TEXT,
    "ContactPhoneNumber" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("PurchaseOrderId")
);

-- CreateTable
CREATE TABLE "Catagory" (
    "CatagoryId" SERIAL NOT NULL,
    "CatagoryName" TEXT NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "CatagoryCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Catagory_pkey" PRIMARY KEY ("CatagoryId")
);

-- CreateTable
CREATE TABLE "Stock" (
    "StockId" SERIAL NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "Barcode" TEXT NOT NULL,
    "StockPrice" DOUBLE PRECISION NOT NULL,
    "ReceiptId" INTEGER,
    "PurchaseOrderId" INTEGER,
    "Issue" INTEGER,
    "Remain" INTEGER,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("StockId")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "ReceiptId" SERIAL NOT NULL,
    "ReceiptDateTime" TIMESTAMP(3) NOT NULL,
    "ReceiptTotalPrice" DOUBLE PRECISION NOT NULL,
    "PurchaseOrderId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "ReceiptCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("ReceiptId")
);

-- CreateTable
CREATE TABLE "WithdrawnRequest" (
    "RequestId" SERIAL NOT NULL,
    "RequestDate" TIMESTAMP(3) NOT NULL,
    "WithdrawnRequestStatus" TEXT NOT NULL,
    "BranchId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "WithdrawnRequestCode" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "WithdrawnRequest_pkey" PRIMARY KEY ("RequestId")
);

-- CreateTable
CREATE TABLE "ReceiptDetail" (
    "ReceiptDetailId" SERIAL NOT NULL,
    "ReceiptId" INTEGER NOT NULL,
    "PurchaseOrderDetailId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "MaterialQuantity" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "ReceiptDetail_pkey" PRIMARY KEY ("ReceiptDetailId")
);

-- CreateTable
CREATE TABLE "WithdrawnRequestDetail" (
    "WithdrawnRequestDetailId" SERIAL NOT NULL,
    "RequestId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "WithdrawnQuantity" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "WithdrawnRequestDetail_pkey" PRIMARY KEY ("WithdrawnRequestDetailId")
);

-- CreateTable
CREATE TABLE "Issue" (
    "IssueId" SERIAL NOT NULL,
    "RequestId" INTEGER NOT NULL,
    "BranchId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "IssueStatus" TEXT NOT NULL,
    "IssueDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("IssueId")
);

-- CreateTable
CREATE TABLE "IssueDetail" (
    "IssueDetailId" SERIAL NOT NULL,
    "RequestId" INTEGER NOT NULL,
    "MaterialId" INTEGER NOT NULL,
    "Barcode" TEXT NOT NULL,
    "IssueQuantity" INTEGER NOT NULL,
    "IssueId" INTEGER NOT NULL,
    "CompanyId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" INTEGER,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "UpdatedBy" INTEGER,

    CONSTRAINT "IssueDetail_pkey" PRIMARY KEY ("IssueDetailId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_CompanyCode_key" ON "Company"("CompanyCode");

-- CreateIndex
CREATE INDEX "Company_CompanyName_idx" ON "Company"("CompanyName");

-- CreateIndex
CREATE INDEX "Company_CompanyCode_idx" ON "Company"("CompanyCode");

-- CreateIndex
CREATE INDEX "Company_CompanyStatus_idx" ON "Company"("CompanyStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TempCompany_TempCompanyCode_key" ON "TempCompany"("TempCompanyCode");

-- CreateIndex
CREATE INDEX "TempCompany_TempCompanyName_idx" ON "TempCompany"("TempCompanyName");

-- CreateIndex
CREATE INDEX "TempCompany_TempCompanyCode_idx" ON "TempCompany"("TempCompanyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_WarehouseCode_key" ON "Warehouse"("WarehouseCode");

-- CreateIndex
CREATE INDEX "Warehouse_WarehouseName_idx" ON "Warehouse"("WarehouseName");

-- CreateIndex
CREATE INDEX "Warehouse_CompanyId_idx" ON "Warehouse"("CompanyId");

-- CreateIndex
CREATE INDEX "Warehouse_WarehouseCode_idx" ON "Warehouse"("WarehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_UserName_key" ON "User"("UserName");

-- CreateIndex
CREATE INDEX "User_UserName_idx" ON "User"("UserName");

-- CreateIndex
CREATE INDEX "User_BranchId_idx" ON "User"("BranchId");

-- CreateIndex
CREATE INDEX "User_CompanyId_idx" ON "User"("CompanyId");

-- CreateIndex
CREATE INDEX "User_TempCompanyId_idx" ON "User"("TempCompanyId");

-- CreateIndex
CREATE INDEX "User_UserStatusApprove_idx" ON "User"("UserStatusApprove");

-- CreateIndex
CREATE INDEX "User_UserStatusActive_idx" ON "User"("UserStatusActive");

-- CreateIndex
CREATE INDEX "User_RequestedRoleText_idx" ON "User"("RequestedRoleText");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_BranchCode_key" ON "Branch"("BranchCode");

-- CreateIndex
CREATE INDEX "Branch_BranchName_idx" ON "Branch"("BranchName");

-- CreateIndex
CREATE INDEX "Branch_CompanyId_idx" ON "Branch"("CompanyId");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_PurchaseOrderId_idx" ON "PurchaseOrderDetail"("PurchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_MaterialId_idx" ON "PurchaseOrderDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_CompanyId_idx" ON "PurchaseOrderDetail"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderDetail_PurchaseOrderId_MaterialId_key" ON "PurchaseOrderDetail"("PurchaseOrderId", "MaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_RoleCode_key" ON "Role"("RoleCode");

-- CreateIndex
CREATE INDEX "Role_RoleName_idx" ON "Role"("RoleName");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_SupplierCode_key" ON "Supplier"("SupplierCode");

-- CreateIndex
CREATE INDEX "Supplier_SupplierName_idx" ON "Supplier"("SupplierName");

-- CreateIndex
CREATE INDEX "Supplier_SupplierCode_idx" ON "Supplier"("SupplierCode");

-- CreateIndex
CREATE INDEX "Supplier_CompanyId_idx" ON "Supplier"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_MaterialCode_key" ON "Material"("MaterialCode");

-- CreateIndex
CREATE INDEX "Material_MaterialName_idx" ON "Material"("MaterialName");

-- CreateIndex
CREATE INDEX "Material_MaterialCode_idx" ON "Material"("MaterialCode");

-- CreateIndex
CREATE INDEX "Material_CompanyId_idx" ON "Material"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_PurchaseOrderCode_key" ON "PurchaseOrder"("PurchaseOrderCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_PurchaseOrderCode_idx" ON "PurchaseOrder"("PurchaseOrderCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_PurchaseOrderStatus_idx" ON "PurchaseOrder"("PurchaseOrderStatus");

-- CreateIndex
CREATE INDEX "PurchaseOrder_CompanyId_idx" ON "PurchaseOrder"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Catagory_CatagoryCode_key" ON "Catagory"("CatagoryCode");

-- CreateIndex
CREATE INDEX "Catagory_CatagoryName_idx" ON "Catagory"("CatagoryName");

-- CreateIndex
CREATE INDEX "Catagory_CatagoryCode_idx" ON "Catagory"("CatagoryCode");

-- CreateIndex
CREATE INDEX "Catagory_CompanyId_idx" ON "Catagory"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_Barcode_key" ON "Stock"("Barcode");

-- CreateIndex
CREATE INDEX "Stock_Barcode_idx" ON "Stock"("Barcode");

-- CreateIndex
CREATE INDEX "Stock_CompanyId_idx" ON "Stock"("CompanyId");

-- CreateIndex
CREATE INDEX "Stock_WarehouseId_idx" ON "Stock"("WarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_ReceiptCode_key" ON "Receipt"("ReceiptCode");

-- CreateIndex
CREATE INDEX "Receipt_ReceiptCode_idx" ON "Receipt"("ReceiptCode");

-- CreateIndex
CREATE INDEX "Receipt_CompanyId_idx" ON "Receipt"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawnRequest_WithdrawnRequestCode_key" ON "WithdrawnRequest"("WithdrawnRequestCode");

-- CreateIndex
CREATE INDEX "WithdrawnRequest_WithdrawnRequestCode_idx" ON "WithdrawnRequest"("WithdrawnRequestCode");

-- CreateIndex
CREATE INDEX "WithdrawnRequest_CompanyId_idx" ON "WithdrawnRequest"("CompanyId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_ReceiptId_idx" ON "ReceiptDetail"("ReceiptId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_MaterialId_idx" ON "ReceiptDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_CompanyId_idx" ON "ReceiptDetail"("CompanyId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_WarehouseId_idx" ON "ReceiptDetail"("WarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptDetail_ReceiptId_MaterialId_key" ON "ReceiptDetail"("ReceiptId", "MaterialId");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_RequestId_idx" ON "WithdrawnRequestDetail"("RequestId");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_MaterialId_idx" ON "WithdrawnRequestDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_CompanyId_idx" ON "WithdrawnRequestDetail"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawnRequestDetail_RequestId_MaterialId_key" ON "WithdrawnRequestDetail"("RequestId", "MaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_RequestId_key" ON "Issue"("RequestId");

-- CreateIndex
CREATE INDEX "Issue_RequestId_idx" ON "Issue"("RequestId");

-- CreateIndex
CREATE INDEX "Issue_BranchId_idx" ON "Issue"("BranchId");

-- CreateIndex
CREATE INDEX "Issue_CompanyId_idx" ON "Issue"("CompanyId");

-- CreateIndex
CREATE INDEX "IssueDetail_RequestId_idx" ON "IssueDetail"("RequestId");

-- CreateIndex
CREATE INDEX "IssueDetail_MaterialId_idx" ON "IssueDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "IssueDetail_CompanyId_idx" ON "IssueDetail"("CompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueDetail_IssueId_MaterialId_Barcode_key" ON "IssueDetail"("IssueId", "MaterialId", "Barcode");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempCompany" ADD CONSTRAINT "TempCompany_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempCompany" ADD CONSTRAINT "TempCompany_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Role"("RoleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_BranchId_fkey" FOREIGN KEY ("BranchId") REFERENCES "Branch"("BranchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_TempCompanyId_fkey" FOREIGN KEY ("TempCompanyId") REFERENCES "TempCompany"("TempCompanyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_PurchaseOrderId_fkey" FOREIGN KEY ("PurchaseOrderId") REFERENCES "PurchaseOrder"("PurchaseOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_CatagoryId_fkey" FOREIGN KEY ("CatagoryId") REFERENCES "Catagory"("CatagoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_SupplierId_fkey" FOREIGN KEY ("SupplierId") REFERENCES "Supplier"("SupplierId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catagory" ADD CONSTRAINT "Catagory_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catagory" ADD CONSTRAINT "Catagory_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catagory" ADD CONSTRAINT "Catagory_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_ReceiptId_fkey" FOREIGN KEY ("ReceiptId") REFERENCES "Receipt"("ReceiptId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_PurchaseOrderId_fkey" FOREIGN KEY ("PurchaseOrderId") REFERENCES "PurchaseOrder"("PurchaseOrderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_PurchaseOrderId_fkey" FOREIGN KEY ("PurchaseOrderId") REFERENCES "PurchaseOrder"("PurchaseOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequest" ADD CONSTRAINT "WithdrawnRequest_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequest" ADD CONSTRAINT "WithdrawnRequest_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequest" ADD CONSTRAINT "WithdrawnRequest_BranchId_fkey" FOREIGN KEY ("BranchId") REFERENCES "Branch"("BranchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequest" ADD CONSTRAINT "WithdrawnRequest_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_ReceiptId_fkey" FOREIGN KEY ("ReceiptId") REFERENCES "Receipt"("ReceiptId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_PurchaseOrderDetailId_fkey" FOREIGN KEY ("PurchaseOrderDetailId") REFERENCES "PurchaseOrderDetail"("PurchaseOrderDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDetail" ADD CONSTRAINT "ReceiptDetail_WarehouseId_fkey" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouse"("WarehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_RequestId_fkey" FOREIGN KEY ("RequestId") REFERENCES "WithdrawnRequest"("RequestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawnRequestDetail" ADD CONSTRAINT "WithdrawnRequestDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_RequestId_fkey" FOREIGN KEY ("RequestId") REFERENCES "WithdrawnRequest"("RequestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_BranchId_fkey" FOREIGN KEY ("BranchId") REFERENCES "Branch"("BranchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_UpdatedBy_fkey" FOREIGN KEY ("UpdatedBy") REFERENCES "User"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_IssueId_fkey" FOREIGN KEY ("IssueId") REFERENCES "Issue"("IssueId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_MaterialId_fkey" FOREIGN KEY ("MaterialId") REFERENCES "Material"("MaterialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("CompanyId") ON DELETE RESTRICT ON UPDATE CASCADE;
