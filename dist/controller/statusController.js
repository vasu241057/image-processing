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
exports.checkStatus = checkStatus;
const client_1 = __importDefault(require("../prisma/client"));
function checkStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { requestId } = req.params;
        const processingRequest = yield client_1.default.processingRequest.findUnique({
            where: { id: requestId },
            include: { products: true },
        });
        if (!processingRequest) {
            return res.status(404).json({ error: "Request not found." });
        }
        res.json(processingRequest);
    });
}
