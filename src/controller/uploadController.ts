import { Request, Response } from "express";
import { validateCSV } from "../services/csvValidationService";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "../services/imageProcessingService";
import prisma from "../prisma/client";
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from "csv-writer";

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
  const outputFilePath = path.join(__dirname, `../../output-${requestId}.csv`);

  try {
    const csvWriter = createObjectCsvWriter({
      path: outputFilePath,
      header: [
        { id: "serialNumber", title: "S. No." },
        { id: "productName", title: "Product Name" },
        { id: "inputImageUrls", title: "Input Image Urls" },
        { id: "outputImageUrls", title: "Output Image Urls" },
      ],
    });

    const records: Array<{
      serialNumber: number;
      productName: string;
      inputImageUrls: string;
      outputImageUrls: string;
    }> = [];

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

    const processingRequest = await prisma.processingRequest.create({
      data: {
        id: requestId,
        csvFilePath: file.originalname,
        status: "COMPLETED",
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

    processedData.forEach((record) => {
      records.push({
        serialNumber: +record.serialNumber,
        productName: record.productName,
        inputImageUrls: record.inputImageUrls,
        outputImageUrls: record.outputImageUrls,
      });
    });

    await csvWriter.writeRecords(records);

    res.download(outputFilePath, `output-${requestId}.csv`, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return res.status(500).json({ error: "Error sending file." });
      }

      fs.unlink(outputFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
        } else {
          console.log(`File ${outputFilePath} deleted successfully.`);
        }
      });
    });
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
