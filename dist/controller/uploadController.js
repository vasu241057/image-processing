"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSV = uploadCSV;
const csvValidationService_1 = require("../services/csvValidationService");
const client_1 = __importDefault(require("../prisma/client"));
const uuid_1 = require("uuid");
const imageProcessingService_1 = require("../services/imageProcessingService");
function uploadCSV(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded." });
        }
        const csvData = file.buffer.toString("utf-8");
        let validatedData;
        try {
            validatedData = (0, csvValidationService_1.validateCSV)(csvData);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
        const requestId = (0, uuid_1.v4)();
        const processingRequest = yield client_1.default.processingRequest.create({
            data: {
                id: requestId,
                csvFilePath: file.originalname,
                products: {
                    create: validatedData.map((record) => ({
                        serialNumber: record.serialNumber,
                        productName: record.productName,
                        inputImageUrls: record.inputImageUrls,
                    })),
                },
            },
            include: {
                products: true,
            },
        });
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            for (const product of processingRequest.products) {
                const inputUrls = product.inputImageUrls.split(",");
                const outputUrls = yield Promise.all(inputUrls.map((url) => (0, imageProcessingService_1.compressImage)(url)));
                yield client_1.default.product.update({
                    where: { id: product.id },
                    data: { outputImageUrls: outputUrls.join(",") },
                });
            }
            yield client_1.default.processingRequest.update({
                where: { id: requestId },
                data: { status: "COMPLETED" },
            });
        }), 1000);
        res.json({ requestId });
    });
}
