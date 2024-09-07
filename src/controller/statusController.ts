import { Request, Response } from "express";
import prisma from "../prisma/client";

export async function checkStatus(req: Request, res: Response) {
  const { requestId } = req.params;

  const processingRequest = await prisma.processingRequest.findUnique({
    where: { id: requestId },
    include: { products: true },
  });

  if (!processingRequest) {
    return res.status(404).json({ error: "Request not found." });
  }

  res.json(processingRequest);
}
