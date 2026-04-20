/*
  Warnings:

  - You are about to drop the column `entity` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `entity_id` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ActivityLog` table. All the data in the column will be lost.
  - Added the required column `user_name` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "entity",
DROP COLUMN "entity_id",
DROP COLUMN "user_id",
ADD COLUMN     "user_name" TEXT NOT NULL;
