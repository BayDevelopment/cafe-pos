-- CreateTable
CREATE TABLE "shop_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "shop_name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_settings_user_id_key" ON "shop_settings"("user_id");

-- AddForeignKey
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
