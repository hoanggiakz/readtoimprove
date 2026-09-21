-- CreateTable
CREATE TABLE "UserReadingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyArticleGoal" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReadingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReadingGoal_userId_key" ON "UserReadingGoal"("userId");

-- CreateIndex
CREATE INDEX "UserReadingGoal_userId_idx" ON "UserReadingGoal"("userId");

-- AddForeignKey
ALTER TABLE "UserReadingGoal" ADD CONSTRAINT "UserReadingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "ReadingHistory_userId_idx";

-- CreateIndex
CREATE INDEX "ReadingHistory_userId_lastReadAt_idx" ON "ReadingHistory"("userId", "lastReadAt" DESC);

-- CreateIndex
CREATE INDEX "ReadingHistory_userId_completed_lastReadAt_idx" ON "ReadingHistory"("userId", "completed", "lastReadAt" DESC);

-- DropIndex
DROP INDEX IF EXISTS "Favorite_userId_idx";

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt" DESC);
