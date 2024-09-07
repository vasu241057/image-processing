import express from "express";
import { checkStatus } from "../controller/statusController";

const router = express.Router();

router.get("/status/:requestId", checkStatus);

export default router;
