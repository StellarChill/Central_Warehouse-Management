-- CreateIndex
CREATE INDEX "Branch_BranchName_idx" ON "Branch"("BranchName");

-- CreateIndex
CREATE INDEX "Catagory_CatagoryName_idx" ON "Catagory"("CatagoryName");

-- CreateIndex
CREATE INDEX "Catagory_CatagoryCode_idx" ON "Catagory"("CatagoryCode");

-- CreateIndex
CREATE INDEX "Issue_RequestId_idx" ON "Issue"("RequestId");

-- CreateIndex
CREATE INDEX "Issue_BranchId_idx" ON "Issue"("BranchId");

-- CreateIndex
CREATE INDEX "IssueDetail_RequestId_idx" ON "IssueDetail"("RequestId");

-- CreateIndex
CREATE INDEX "IssueDetail_MaterialId_idx" ON "IssueDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "Material_MaterialName_idx" ON "Material"("MaterialName");

-- CreateIndex
CREATE INDEX "Material_MaterialCode_idx" ON "Material"("MaterialCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_PurchaseOrderCode_idx" ON "PurchaseOrder"("PurchaseOrderCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_PurchaseOrderStatus_idx" ON "PurchaseOrder"("PurchaseOrderStatus");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_PurchaseOrderId_idx" ON "PurchaseOrderDetail"("PurchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderDetail_MaterialId_idx" ON "PurchaseOrderDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "Receipt_ReceiptCode_idx" ON "Receipt"("ReceiptCode");

-- CreateIndex
CREATE INDEX "ReceiptDetail_ReceiptId_idx" ON "ReceiptDetail"("ReceiptId");

-- CreateIndex
CREATE INDEX "ReceiptDetail_MaterialId_idx" ON "ReceiptDetail"("MaterialId");

-- CreateIndex
CREATE INDEX "Role_RoleName_idx" ON "Role"("RoleName");

-- CreateIndex
CREATE INDEX "Stock_Barcode_idx" ON "Stock"("Barcode");

-- CreateIndex
CREATE INDEX "Supplier_SupplierName_idx" ON "Supplier"("SupplierName");

-- CreateIndex
CREATE INDEX "Supplier_SupplierCode_idx" ON "Supplier"("SupplierCode");

-- CreateIndex
CREATE INDEX "User_UserName_idx" ON "User"("UserName");

-- CreateIndex
CREATE INDEX "User_BranchId_idx" ON "User"("BranchId");

-- CreateIndex
CREATE INDEX "WithdrawnRequest_WithdrawnRequestCode_idx" ON "WithdrawnRequest"("WithdrawnRequestCode");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_RequestId_idx" ON "WithdrawnRequestDetail"("RequestId");

-- CreateIndex
CREATE INDEX "WithdrawnRequestDetail_MaterialId_idx" ON "WithdrawnRequestDetail"("MaterialId");
