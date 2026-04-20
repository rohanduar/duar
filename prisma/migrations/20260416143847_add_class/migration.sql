-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "teacher_id" TEXT;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
