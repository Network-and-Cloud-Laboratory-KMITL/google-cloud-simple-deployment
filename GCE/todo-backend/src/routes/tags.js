import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import * as storage from "../storage.js";

export const tagsRouter = Router();

// GET /api/v1/tags
tagsRouter.get("/", (req, res) => {
  res.json({ data: storage.getAllTags() });
});

// GET /api/v1/tags/:tagId
tagsRouter.get("/:tagId", (req, res) => {
  const tag = storage.getTag(req.params.tagId);
  if (!tag) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Tag with id '${req.params.tagId}' not found`,
      },
    });
  }
  res.json({ data: tag });
});

// POST /api/v1/tags
tagsRouter.post("/", (req, res) => {
  const { name, color } = req.body;

  // Validate color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Color must be in hex format (#RRGGBB)",
      },
    });
  }

  // Check for duplicate name
  const existingTags = storage.getAllTags();
  if (existingTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({
      error: {
        code: "CONFLICT",
        message: `Tag with name '${name}' already exists`,
      },
    });
  }

  const now = new Date().toISOString();
  const tag = { id: uuidv4(), name, color, createdAt: now, updatedAt: now };

  storage.createTag(tag);
  res.status(201).json({ data: tag });
});

// PATCH /api/v1/tags/:tagId
tagsRouter.patch("/:tagId", (req, res) => {
  const tag = storage.getTag(req.params.tagId);
  if (!tag) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Tag with id '${req.params.tagId}' not found`,
      },
    });
  }

  const { name, color } = req.body;

  // Validate color format if provided
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Color must be in hex format (#RRGGBB)",
      },
    });
  }

  // Check for duplicate name if name is being updated
  if (name) {
    const existingTags = storage.getAllTags();
    if (
      existingTags.some(
        (t) =>
          t.id !== req.params.tagId &&
          t.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: `Tag with name '${name}' already exists`,
        },
      });
    }
  }

  const updatedTag = { ...tag, updatedAt: new Date().toISOString() };
  if (name !== undefined) updatedTag.name = name;
  if (color !== undefined) updatedTag.color = color;

  storage.updateTag(req.params.tagId, updatedTag);
  res.json({ data: updatedTag });
});

// DELETE /api/v1/tags/:tagId
tagsRouter.delete("/:tagId", (req, res) => {
  if (!storage.deleteTag(req.params.tagId)) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Tag with id '${req.params.tagId}' not found`,
      },
    });
  }
  res.status(204).send();
});
