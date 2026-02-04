import express from "express";
import cors from "cors";
import { tasksRouter } from "./routes/tasks.js";
import { tagsRouter } from "./routes/tags.js";
import { statsRouter } from "./routes/stats.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/tags", tagsRouter);
app.use("/api/v1", statsRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Todo Dashboard API",
    docs: "/docs",
    version: "1.0.0",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      details: { error: err.message },
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
