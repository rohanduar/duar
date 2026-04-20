-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "available_from" TIMESTAMP(3),
ADD COLUMN     "available_until" TIMESTAMP(3),
ADD COLUMN     "due_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
