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
exports.compressImage = compressImage;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const sharp_1 = __importDefault(require("sharp"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
let tempCredentials = null;
const sts = new aws_sdk_1.default.STS();
function getTemporaryCredentials() {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            RoleArn: "arn:aws:iam::975050328139:role/Vasu-S3",
            RoleSessionName: "image-processing",
        };
        const data = yield sts.assumeRole(params).promise();
        return data.Credentials;
    });
}
function getS3Client() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tempCredentials ||
            Date.now() > new Date(tempCredentials.Expiration).getTime()) {
            tempCredentials = yield getTemporaryCredentials();
        }
        return new aws_sdk_1.default.S3({
            accessKeyId: tempCredentials.AccessKeyId,
            secretAccessKey: tempCredentials.SecretAccessKey,
            sessionToken: tempCredentials.SessionToken,
            region: "Asia Pacific (Mumbai) ap-south-1",
        });
    });
}
function compressImage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(url, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data);
        const compressedImageBuffer = yield (0, sharp_1.default)(imageBuffer)
            .jpeg({ quality: 50 })
            .toBuffer();
        const outputFileName = `${(0, uuid_1.v4)()}.jpg`;
        let s3 = yield getS3Client();
        const params = {
            Bucket: "image-processing-project",
            Key: outputFileName,
            Body: compressedImageBuffer,
            ContentType: "image/jpeg",
        };
        try {
            const uploadResult = yield s3.upload(params).promise();
            return uploadResult.Location;
        }
        catch (error) {
            if (error.code === "ExpiredToken" || error.code === "InvalidToken") {
                tempCredentials = yield getTemporaryCredentials();
                s3 = yield getS3Client();
                const uploadResult = yield s3.upload(params).promise();
                return uploadResult.Location;
            }
            else {
                throw error;
            }
        }
    });
}
