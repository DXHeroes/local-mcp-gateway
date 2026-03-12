/*
  Warnings:

  - Added the required column `updated_at` to the `oauth_application` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "profiles_name_key";

-- AlterTable
ALTER TABLE "oauth_application" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
