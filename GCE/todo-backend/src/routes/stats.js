import { Router } from "express";
import * as storage from "../storage.js";

export const statsRouter = Router();

// GET /api/v1/stats
statsRouter.get("/stats", (req, res) => {
  res.json({ data: storage.getStatistics() });
});

// GET /api/v1/contributions
statsRouter.get("/contributions", (req, res) => {
  const { startDate, endDate, days = "365" } = req.query;

  const result = storage.getContributions({
    startDate: startDate || null,
    endDate: endDate || null,
    days: parseInt(days),
  });

  res.json(result);
});
