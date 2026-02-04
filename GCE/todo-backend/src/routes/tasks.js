import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import * as storage from "../storage.js";

export const tasksRouter = Router();

// GET /api/v1/tasks
tasksRouter.get("/", (req, res) => {
  const {
    status = "all",
    archived = "false",
    tags,
    page = "1",
    limit = "50",
  } = req.query;

  const tagList = tags ? tags.split(",") : null;
  const { tasks, total } = storage.getAllTasks({
    status,
    archived: archived === "true",
    tags: tagList,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  res.json({
    data: tasks,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: total > 0 ? Math.ceil(total / limitNum) : 1,
    },
  });
});

// GET /api/v1/tasks/:taskId
tasksRouter.get("/:taskId", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }
  res.json({ data: task });
});

// POST /api/v1/tasks
tasksRouter.post("/", (req, res) => {
  const { title, type, tags = [], subTasks = [] } = req.body;

  // Validate tags exist
  for (const tagId of tags) {
    if (!storage.getTag(tagId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Tag with id '${tagId}' not found`,
        },
      });
    }
  }

  const now = new Date().toISOString();
  const task = {
    id: uuidv4(),
    title,
    type,
    completed: false,
    archived: false,
    createdAt: now,
    completedAt: null,
    updatedAt: now,
    tags,
    subTasks:
      type === "advanced"
        ? subTasks.map((st) => ({
            id: uuidv4(),
            title: st.title,
            completed: false,
          }))
        : [],
  };

  storage.createTask(task);
  res.status(201).json({ data: task });
});

// PATCH /api/v1/tasks/:taskId
tasksRouter.patch("/:taskId", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const { title, completed, archived, tags } = req.body;

  // Validate tags if provided
  if (tags) {
    for (const tagId of tags) {
      if (!storage.getTag(tagId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Tag with id '${tagId}' not found`,
          },
        });
      }
    }
  }

  const updatedTask = { ...task, updatedAt: new Date().toISOString() };

  if (title !== undefined) updatedTask.title = title;
  if (tags !== undefined) updatedTask.tags = tags;
  if (archived !== undefined) updatedTask.archived = archived;

  if (completed !== undefined) {
    updatedTask.completed = completed;
    updatedTask.completedAt = completed ? new Date().toISOString() : null;
  }

  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// DELETE /api/v1/tasks/:taskId
tasksRouter.delete("/:taskId", (req, res) => {
  if (!storage.deleteTask(req.params.taskId)) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }
  res.status(204).send();
});

// PATCH /api/v1/tasks/:taskId/toggle
tasksRouter.patch("/:taskId/toggle", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const updatedTask = {
    ...task,
    completed: !task.completed,
    completedAt: !task.completed ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// PATCH /api/v1/tasks/:taskId/archive
tasksRouter.patch("/:taskId/archive", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const updatedTask = {
    ...task,
    archived: true,
    updatedAt: new Date().toISOString(),
  };
  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// PATCH /api/v1/tasks/:taskId/restore
tasksRouter.patch("/:taskId/restore", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const updatedTask = {
    ...task,
    archived: false,
    updatedAt: new Date().toISOString(),
  };
  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// POST /api/v1/tasks/:taskId/subtasks
tasksRouter.post("/:taskId/subtasks", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  if (task.type !== "advanced") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Cannot add subtasks to a simple task",
      },
    });
  }

  const newSubtask = { id: uuidv4(), title: req.body.title, completed: false };
  const updatedTask = {
    ...task,
    subTasks: [...task.subTasks, newSubtask],
    updatedAt: new Date().toISOString(),
  };

  storage.updateTask(req.params.taskId, updatedTask);
  res.status(201).json({ data: updatedTask });
});

// PATCH /api/v1/tasks/:taskId/subtasks/:subtaskId
tasksRouter.patch("/:taskId/subtasks/:subtaskId", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const subtaskIndex = task.subTasks.findIndex(
    (st) => st.id === req.params.subtaskId,
  );
  if (subtaskIndex === -1) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `SubTask with id '${req.params.subtaskId}' not found`,
      },
    });
  }

  const { title, completed } = req.body;
  const updatedSubtasks = [...task.subTasks];
  if (title !== undefined) updatedSubtasks[subtaskIndex].title = title;
  if (completed !== undefined)
    updatedSubtasks[subtaskIndex].completed = completed;

  const allCompleted =
    updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
  const updatedTask = {
    ...task,
    subTasks: updatedSubtasks,
    completed: allCompleted,
    completedAt:
      allCompleted && !task.completed
        ? new Date().toISOString()
        : task.completedAt,
    updatedAt: new Date().toISOString(),
  };

  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// PATCH /api/v1/tasks/:taskId/subtasks/:subtaskId/toggle
tasksRouter.patch("/:taskId/subtasks/:subtaskId/toggle", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const subtaskIndex = task.subTasks.findIndex(
    (st) => st.id === req.params.subtaskId,
  );
  if (subtaskIndex === -1) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `SubTask with id '${req.params.subtaskId}' not found`,
      },
    });
  }

  const updatedSubtasks = [...task.subTasks];
  updatedSubtasks[subtaskIndex].completed =
    !updatedSubtasks[subtaskIndex].completed;

  const allCompleted =
    updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
  const updatedTask = {
    ...task,
    subTasks: updatedSubtasks,
    completed: allCompleted,
    completedAt: allCompleted ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});

// DELETE /api/v1/tasks/:taskId/subtasks/:subtaskId
tasksRouter.delete("/:taskId/subtasks/:subtaskId", (req, res) => {
  const task = storage.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Task with id '${req.params.taskId}' not found`,
      },
    });
  }

  const originalLength = task.subTasks.length;
  const updatedSubtasks = task.subTasks.filter(
    (st) => st.id !== req.params.subtaskId,
  );

  if (updatedSubtasks.length === originalLength) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `SubTask with id '${req.params.subtaskId}' not found`,
      },
    });
  }

  const updatedTask = {
    ...task,
    subTasks: updatedSubtasks,
    updatedAt: new Date().toISOString(),
  };
  storage.updateTask(req.params.taskId, updatedTask);
  res.json({ data: updatedTask });
});
