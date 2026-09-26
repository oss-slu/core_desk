-- CreateTable
CREATE TABLE "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailJobCreated" BOOLEAN NOT NULL DEFAULT true,
    "emailCommentCreated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserNotificationSettings" ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
