-- AlterTable
ALTER TABLE "User" ADD COLUMN     "RequestedRoleText" TEXT;

-- CreateIndex
CREATE INDEX "User_RequestedRoleText_idx" ON "User"("RequestedRoleText");
