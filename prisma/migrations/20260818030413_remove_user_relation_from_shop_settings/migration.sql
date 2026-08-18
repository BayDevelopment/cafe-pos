/*
  Warnings:

  - You are about to drop the column `user_id` on the `shop_settings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "shop_settings" DROP CONSTRAINT "shop_settings_user_id_fkey";

-- DropIndex
DROP INDEX "shop_settings_user_id_key";

-- AlterTable
ALTER TABLE "shop_settings" DROP COLUMN "user_id";
