import AWS from "aws-sdk";
import sharp from "sharp";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

async function getS3Client() {
  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION,
  });
}

export async function compressImage(url: string): Promise<string> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data);
  console.log("imagebuffer done");

  try {
    const compressedImageBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 50 })
      .toBuffer();
    const outputFileName = `${uuidv4()}.jpg`;

    const s3 = await getS3Client();

    const params = {
      Bucket: "image-processing-project",
      Key: outputFileName,
      Body: compressedImageBuffer,
      ContentType: "image/jpeg",
    };

    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}
