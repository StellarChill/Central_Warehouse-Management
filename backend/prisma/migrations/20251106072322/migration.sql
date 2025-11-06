/*
  Warnings:

  - A unique constraint covering the columns `[LineId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_LineId_key" ON "User"("LineId");
