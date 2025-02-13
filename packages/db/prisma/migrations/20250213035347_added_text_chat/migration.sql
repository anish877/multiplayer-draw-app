-- CreateTable
CREATE TABLE "Text_Chat" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Text_Chat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Text_Chat" ADD CONSTRAINT "Text_Chat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Text_Chat" ADD CONSTRAINT "Text_Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
