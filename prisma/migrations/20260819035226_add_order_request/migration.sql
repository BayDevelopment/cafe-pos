-- CreateEnum
CREATE TYPE "OrderRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "OrderRequest" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT,
    "note" TEXT,
    "status" "OrderRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderRequestItem" (
    "id" SERIAL NOT NULL,
    "orderRequestId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderRequest_sessionId_idx" ON "OrderRequest"("sessionId");

-- CreateIndex
CREATE INDEX "OrderRequest_status_idx" ON "OrderRequest"("status");

-- CreateIndex
CREATE INDEX "OrderRequest_createdAt_idx" ON "OrderRequest"("createdAt");

-- CreateIndex
CREATE INDEX "OrderRequestItem_orderRequestId_idx" ON "OrderRequestItem"("orderRequestId");

-- CreateIndex
CREATE INDEX "OrderRequestItem_productId_idx" ON "OrderRequestItem"("productId");

-- AddForeignKey
ALTER TABLE "OrderRequestItem" ADD CONSTRAINT "OrderRequestItem_orderRequestId_fkey" FOREIGN KEY ("orderRequestId") REFERENCES "OrderRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequestItem" ADD CONSTRAINT "OrderRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
