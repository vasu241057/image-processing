import express from "express";
import multer from "multer";
import { uploadCSV } from "../controller/uploadController";

const upload = multer();
const router = express.Router();

router.post("/upload", upload.single("file"), uploadCSV);

export default router;
