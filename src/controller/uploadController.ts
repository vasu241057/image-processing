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

  const requestId = uuidv4();

  try {
    for (const record of validatedData) {
      const inputUrls = record.inputImageUrls.split(",");
      const outputUrls = [];

      for (const url of inputUrls) {
        try {
          const compressedUrl = await compressImage(url);
          outputUrls.push(compressedUrl);
        } catch (error: any) {
          if (error.message.includes("Corrupt image header detected")) {
            console.error(`Image with URL ${url} is corrupted.`);
            return res.status(400).json({
              error: `Image processing stopped. The image at URL ${url} is corrupted.`,
            });
          } else {
            throw error;
          }
        }
      }

      await prisma.product.create({
        data: {
          serialNumber: +record.serialNumber,
          productName: record.productName,
          inputImageUrls: record.inputImageUrls,
          outputImageUrls: outputUrls.join(","),
          processingRequestId: requestId,
        },
      });
    }

    await prisma.processingRequest.create({
      data: {
        id: requestId,
        csvFilePath: file.originalname,
        status: "COMPLETED",
      },
    });

    res.json({ requestId });
  } catch (error) {
    console.error("Error processing images or inserting into database:", error);
    await prisma.processingRequest.update({
      where: { id: requestId },
      data: { status: "FAILED" },
    });
    res
      .status(500)
      .json({ error: "Error processing images or inserting into database." });
  }
}
