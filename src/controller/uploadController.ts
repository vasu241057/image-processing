import { Request, Response } from "express";
import { validateCSV } from "../services/csvValidationService";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "../services/imageProcessingService";
import prisma from "../prisma/client";

export async function uploadCSV(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const csvData = file.buffer.toString("utf-8");
  let validatedData;

  try {
    validatedData = validateCSV(csvData);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  console.log("CSV validated");
  console.log(validatedData);

  const requestId = uuidv4();

  try {
    // Compress images first
    const processedData = await Promise.all(
      validatedData.map(async (record) => {
        const inputUrls = record.inputImageUrls.split(",");
        const outputUrls = await Promise.all(
          inputUrls.map((url: string) => compressImage(url))
        );
        return {
          ...record,
          outputImageUrls: outputUrls.join(","),
        };
      })
    );

    // After successful compression, insert data into the database
    const processingRequest = await prisma.processingRequest.create({
      data: {
        id: requestId,
        csvFilePath: file.originalname,
        products: {
          create: processedData.map((record) => ({
            serialNumber: +record.serialNumber,
            productName: record.productName,
            inputImageUrls: record.inputImageUrls,
            outputImageUrls: record.outputImageUrls,
          })),
        },
      },
      include: {
        products: true,
      },
    });

    await prisma.processingRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    res.json({ requestId });
  } catch (error) {
    console.error("Error processing images or inserting into database:", error);
    res
      .status(500)
      .json({ error: "Error processing images or inserting into database." });
  }
}
