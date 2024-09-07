import express from "express";
import uploadRoutes from "./routes/uploadRoutes";
import statusRoutes from "./routes/statusRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api", uploadRoutes);
app.use("/api", statusRoutes);

app.use(errorHandler);

export default app;
