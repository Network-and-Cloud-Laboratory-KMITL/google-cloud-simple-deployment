import React, { useState } from "react";
import type { Task, Tag, SubTask } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Plus, X, InfoIcon, Settings } from "lucide-react";
import "../styles/TaskForm.css";

interface TaskFormProps {
  tags: Tag[];
  onAddTask: (task: Task) => void;
  onClose: () => void;
  onOpenTagManager: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  tags,
  onAddTask,
  onClose,
  onOpenTagManager,
}) => {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<"simple" | "advanced">("simple");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const baseTask = {
      id: uuidv4(),
      title: title.trim(),
      completed: false,
      createdAt: new Date(),
      tags: selectedTags,
    };

    if (taskType === "simple") {
      onAddTask({ ...baseTask, type: "simple" });
    } else {
      onAddTask({ ...baseTask, type: "advanced", subTasks });
    }

    onClose();
  };

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    setSubTasks([
      ...subTasks,
      { id: uuidv4(), title: newSubTask.trim(), completed: false },
    ]);
    setNewSubTask("");
  };

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter((st) => st.id !== id));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  return (
    <div className="modal-overlay">
      <div className="task-form">
        <div className="form-header">
          <div className="header-title">
            <h2>Create New Task</h2>
            <InfoIcon size={20} className="information-icon" />
            <div className="tooltip">
              <strong>Simple Task:</strong> A basic task with just a title. Mark
              it complete when done.
              <br />
              <br />
              <strong>Advanced Task:</strong> Break down complex work into
              subtasks. Track progress as you complete each subtask. Perfect for
              multi-step projects.
              <br />
              <br />
              Add tags to categorize and filter your tasks easily.
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Task Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${taskType === "simple" ? "active yellow" : ""}`}
                onClick={() => setTaskType("simple")}
              >
                Simple Task
              </button>
              <button
                type="button"
                className={`type-btn ${taskType === "advanced" ? "active green" : ""}`}
                onClick={() => setTaskType("advanced")}
              >
                Advanced Task
              </button>
            </div>
          </div>

          {taskType === "advanced" && (
            <div className="form-group">
              <label>Sub-tasks</label>
              <div className="subtask-input">
                <input
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  placeholder="Add a sub-task..."
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSubTask())
                  }
                />
                <button
                  type="button"
                  className="add-subtask-btn"
                  onClick={addSubTask}
                >
                  <Plus size={18} />
                </button>
              </div>
              <ul className="subtask-list">
                {subTasks.map((st) => (
                  <li key={st.id}>
                    <span>{st.title}</span>
                    <button type="button" onClick={() => removeSubTask(st.id)}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <div className="tags-label-row">
              <label>Tags</label>
              <button
                type="button"
                className="manage-tags-btn"
                onClick={onOpenTagManager}
              >
                <Settings size={14} />
                Manage Tags
              </button>
            </div>
            <div className="tags-selector">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-btn ${selectedTags.includes(tag.id) ? "selected" : ""}`}
                  style={{
                    borderColor: tag.color,
                    backgroundColor: selectedTags.includes(tag.id)
                      ? tag.color
                      : "transparent",
                    color: selectedTags.includes(tag.id) ? "#fff" : tag.color,
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="no-tags-hint">
                  No tags yet. Click "Manage Tags" to create some.
                </span>
              )}
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
};
