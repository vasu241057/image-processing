-- CreateTable
CREATE TABLE "ProcessingRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "csvFilePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "inputImageUrls" TEXT NOT NULL,
    "outputImageUrls" TEXT,
    "processingRequestId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_processingRequestId_fkey" FOREIGN KEY ("processingRequestId") REFERENCES "ProcessingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
