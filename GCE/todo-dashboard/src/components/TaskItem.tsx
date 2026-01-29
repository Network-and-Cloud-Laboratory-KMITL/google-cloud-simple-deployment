import React from "react";
import { type Task, type Tag } from "../types";
import { getTaskProgress } from "../utils/storage";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import "../styles/TaskItem.css";

interface TaskItemProps {
  task: Task;
  tags: Tag[];
  expanded: boolean;
  onToggle: () => void;
  onToggleComplete: () => void;
  onToggleSubTask: (subTaskId: string) => void;
  onDelete: () => void;
  onArchive?: () => void;
  showArchiveButton?: boolean;
  isArchiveView?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  tags,
  expanded,
  onToggle,
  onToggleComplete,
  onToggleSubTask,
  onDelete,
  onArchive,
  showArchiveButton = true,
  isArchiveView = false,
}) => {
  const progress = getTaskProgress(task);
  const taskTags = tags.filter((tag) => task.tags.includes(tag.id));
  const badgeColor = taskTags.length > 0 ? taskTags[0].color : "#4285F4";

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-main">
        <button
          className={`checkbox ${task.completed ? "checked" : ""}`}
          onClick={onToggleComplete}
        >
          {task.completed && <Check size={14} />}
        </button>

        <div
          className="task-content"
          onClick={task.type === "advanced" ? onToggle : undefined}
        >
          <div className="task-title-row">
            <span className="task-title">{task.title}</span>
            {task.type === "advanced" && (
              <span
                className="task-type-badge"
                style={{ backgroundColor: badgeColor }}
              >
                Advanced
              </span>
            )}
          </div>

          <div className="task-meta">
            {taskTags.map((tag) => (
              <span
                key={tag.id}
                className="task-tag"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {task.type === "advanced" && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      progress === 100
                        ? "#34A853"
                        : progress >= 50
                          ? "#FBBC04"
                          : "#4285F4",
                  }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}
        </div>

        <div className="task-actions">
          {task.type === "advanced" && (
            <button className="expand-btn" onClick={onToggle}>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
          {isArchiveView && onArchive && (
            <button
              className="restore-btn"
              onClick={onArchive}
              title="Restore task"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {showArchiveButton &&
            !isArchiveView &&
            task.completed &&
            onArchive && (
              <button
                className="archive-btn"
                onClick={onArchive}
                title="Archive task"
              >
                <Archive size={16} />
              </button>
            )}
          <button className="delete-btn" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {task.type === "advanced" && expanded && (
        <div className="subtasks-container">
          {task.subTasks.map((subTask) => (
            <div
              key={subTask.id}
              className={`subtask-item ${subTask.completed ? "completed" : ""}`}
            >
              <button
                className={`checkbox small ${subTask.completed ? "checked" : ""}`}
                onClick={() => onToggleSubTask(subTask.id)}
              >
                {subTask.completed && <Check size={10} />}
              </button>
              <span>{subTask.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
