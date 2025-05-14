-- CreateTable
CREATE TABLE "B24App" (
    "id" SERIAL NOT NULL,
    "memberId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expires" INTEGER NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "clientEndpoint" TEXT NOT NULL,
    "serverEndpoint" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "B24App_pkey" PRIMARY KEY ("id")
);
