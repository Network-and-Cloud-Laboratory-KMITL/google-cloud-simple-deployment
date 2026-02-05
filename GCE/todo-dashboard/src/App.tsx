import { useState, useEffect, useCallback } from "react";
import { type Task, type Tag, type ContributionDay } from "./types";
import {
  fetchTasks,
  fetchTags,
  createTask as apiCreateTask,
  toggleTask as apiToggleTask,
  toggleSubTask as apiToggleSubTask,
  deleteTask as apiDeleteTask,
  archiveTask as apiArchiveTask,
  restoreTask as apiRestoreTask,
  fetchContributions,
  createTag as apiCreateTag,
  updateTag as apiUpdateTag,
  deleteTag as apiDeleteTag,
} from "./utils/api";
import { TaskForm } from "./components/TaskForm";
import { TaskItem } from "./components/TaskItem";
import { ContributionGraph } from "./components/ContributionGraph";
import { TagManager } from "./components/TagManager";
import { Plus, Tags, Archive, Loader2 } from "lucide-react";
import "./styles/App.css";

type FilterStatus = "all" | "active" | "completed";
type ViewMode = "tasks" | "archive";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [contributionData, setContributionData] = useState<ContributionDay[]>(
    [],
  );
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    advanced: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("tasks");

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [tasksResult, archivedResult, tagsData, contributionsResult] =
        await Promise.all([
          fetchTasks({ archived: false }),
          fetchTasks({ archived: true }),
          fetchTags(),
          fetchContributions({ days: 365 }),
        ]);

      const allTasks = [...tasksResult.data, ...archivedResult.data];
      setTasks(allTasks);
      setTags(tagsData);
      setContributionData(contributionsResult.data);

      const nonArchivedTasks = tasksResult.data;
      setStats({
        total: nonArchivedTasks.length,
        completed: nonArchivedTasks.filter((t) => t.completed).length,
        active: nonArchivedTasks.filter((t) => !t.completed).length,
        advanced: nonArchivedTasks.filter((t) => t.type === "advanced").length,
        archived: archivedResult.data.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTask = async (task: Task) => {
    try {
      const newTask = await apiCreateTask({
        title: task.title,
        type: task.type,
        tags: task.tags,
        subTasks:
          task.type === "advanced"
            ? task.subTasks.map((st) => ({ title: st.title }))
            : undefined,
      });
      setTasks((prev) => [newTask, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1,
        advanced: task.type === "advanced" ? prev.advanced + 1 : prev.advanced,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const updatedTask = await apiToggleTask(taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle task");
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    try {
      const updatedTask = await apiToggleSubTask(taskId, subTaskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle subtask");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiDeleteTask(taskId);
      const task = tasks.find((t) => t.id === taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (task && !task.archived) {
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          completed: task.completed ? prev.completed - 1 : prev.completed,
          active: !task.completed ? prev.active - 1 : prev.active,
          advanced:
            task.type === "advanced" ? prev.advanced - 1 : prev.advanced,
        }));
      } else if (task?.archived) {
        setStats((prev) => ({ ...prev, archived: prev.archived - 1 }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      const updatedTask = await apiArchiveTask(taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive task");
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      const updatedTask = await apiRestoreTask(taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore task");
    }
  };

  const handleUpdateTags = async (newTags: Tag[]) => {
    const currentTagIds = new Set(tags.map((t) => t.id));
    const newTagIds = new Set(newTags.map((t) => t.id));

    try {
      for (const tag of tags) {
        if (!newTagIds.has(tag.id)) {
          await apiDeleteTag(tag.id);
        }
      }

      const updatedTags: Tag[] = [];
      for (const tag of newTags) {
        if (!currentTagIds.has(tag.id)) {
          const created = await apiCreateTag({
            name: tag.name,
            color: tag.color,
          });
          updatedTags.push(created);
        } else {
          const existing = tags.find((t) => t.id === tag.id);
          if (
            existing &&
            (existing.name !== tag.name || existing.color !== tag.color)
          ) {
            const updated = await apiUpdateTag(tag.id, {
              name: tag.name,
              color: tag.color,
            });
            updatedTags.push(updated);
          } else {
            updatedTags.push(tag);
          }
        }
      }

      setTags(updatedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tags");
      const tagsData = await fetchTags();
      setTags(tagsData);
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleFilterTag = (tagId: string) => {
    setFilterTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (viewMode === "tasks" && task.archived) return false;
    if (viewMode === "archive" && !task.archived) return false;

    if (filterStatus === "active" && task.completed) return false;
    if (filterStatus === "completed" && !task.completed) return false;
    if (filterTags.length > 0 && !filterTags.some((t) => task.tags.includes(t)))
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="app">
        <div className="loading-state">
          <Loader2 className="spinner" size={48} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <header className="header">
        <div className="logo">
          <h1>Todo Dashboard</h1>
        </div>
        <div className="header-actions">
          <button
            className={`header-btn ${viewMode === "archive" ? "active" : ""}`}
            onClick={() =>
              setViewMode(viewMode === "tasks" ? "archive" : "tasks")
            }
          >
            <Archive size={18} />
            {viewMode === "archive"
              ? "Back to Tasks"
              : `Archive (${stats.archived})`}
          </button>
          <button
            className="header-btn"
            onClick={() => setShowTagManager(true)}
          >
            <Tags size={18} />
            Manage Tags
          </button>
          <button
            className="header-btn primary"
            onClick={() => setShowTaskForm(true)}
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value blue">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value green">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value yellow">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value red">{stats.advanced}</div>
          <div className="stat-label">Advanced</div>
        </div>
      </div>

      <ContributionGraph data={contributionData} />

      <div className="filter-bar">
        <label>Filter by tag:</label>
        <div className="filter-tags">
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={`filter-tag ${filterTags.includes(tag.id) ? "active" : ""}`}
              style={{
                borderColor: tag.color,
                color: filterTags.includes(tag.id) ? "#fff" : tag.color,
                backgroundColor: filterTags.includes(tag.id)
                  ? tag.color
                  : "transparent",
              }}
              onClick={() => toggleFilterTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="filter-status">
          {(["all", "active", "completed"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              className={`status-btn ${filterStatus === status ? "active" : ""}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <h3>
              {viewMode === "archive" ? "No archived tasks" : "No tasks found"}
            </h3>
            <p>
              {viewMode === "archive"
                ? "Completed tasks can be archived"
                : "Create a new task or adjust your filters"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              tags={tags}
              expanded={expandedTasks.has(task.id)}
              onToggle={() => toggleExpanded(task.id)}
              onToggleComplete={() => handleToggleComplete(task.id)}
              onToggleSubTask={(subTaskId) =>
                handleToggleSubTask(task.id, subTaskId)
              }
              onDelete={() => handleDeleteTask(task.id)}
              onArchive={
                viewMode === "archive"
                  ? () => handleRestoreTask(task.id)
                  : () => handleArchiveTask(task.id)
              }
              showArchiveButton={viewMode === "tasks"}
              isArchiveView={viewMode === "archive"}
            />
          ))
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          tags={tags}
          onAddTask={handleAddTask}
          onClose={() => setShowTaskForm(false)}
          onOpenTagManager={() => {
            setShowTaskForm(false);
            setShowTagManager(true);
          }}
        />
      )}

      {showTagManager && (
        <TagManager
          tags={tags}
          onUpdateTags={handleUpdateTags}
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  );
}

export default App;
