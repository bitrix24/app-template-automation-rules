/*
  Warnings:

  - A unique constraint covering the columns `[memberId,applicationToken,userId]` on the table `B24App` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "B24App" ADD COLUMN     "isFromAppInstall" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "B24App_memberId_applicationToken_userId_key" ON "B24App"("memberId", "applicationToken", "userId");
