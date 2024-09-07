"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const statusRoutes_1 = __importDefault(require("./routes/statusRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Server is running!");
});
app.use("/api", uploadRoutes_1.default);
app.use("/api", statusRoutes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
