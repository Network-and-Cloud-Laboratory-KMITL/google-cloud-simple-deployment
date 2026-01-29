import { type Task, type Tag, type ContributionDay } from "../types";
import { v4 as uuidv4 } from "uuid";
import { format, subDays, startOfDay } from "date-fns";

const TASKS_KEY = "todo-dashboard-tasks";
const TAGS_KEY = "todo-dashboard-tags";

export const loadTasks = (): Task[] => {
  const stored = localStorage.getItem(TASKS_KEY);
  if (!stored) return [];
  const tasks = JSON.parse(stored);
  return tasks.map((task: Task) => ({
    ...task,
    createdAt: new Date(task.createdAt),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }));
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const loadTags = (): Tag[] => {
  const stored = localStorage.getItem(TAGS_KEY);
  if (!stored) {
    const defaultTags: Tag[] = [
      { id: uuidv4(), name: "Work", color: "#4285F4" },
      { id: uuidv4(), name: "Personal", color: "#EA4335" },
      { id: uuidv4(), name: "Urgent", color: "#FBBC04" },
      { id: uuidv4(), name: "Health", color: "#34A853" },
    ];
    saveTags(defaultTags);
    return defaultTags;
  }
  return JSON.parse(stored);
};

export const saveTags = (tags: Tag[]): void => {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
};

export const getContributionData = (tasks: Task[]): ContributionDay[] => {
  const today = startOfDay(new Date());
  const contributionMap = new Map<string, number>();

  // Initialize last 365 days
  for (let i = 364; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    contributionMap.set(date, 0);
  }

  // Count completed tasks
  tasks.forEach((task) => {
    if (task.completedAt) {
      const date = format(startOfDay(new Date(task.completedAt)), "yyyy-MM-dd");
      if (contributionMap.has(date)) {
        contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
      }
    }
    // Count completed subtasks for advanced tasks
    if (task.type === "advanced") {
      task.subTasks.forEach((subTask) => {
        if (subTask.completed && task.completedAt) {
          const date = format(
            startOfDay(new Date(task.completedAt)),
            "yyyy-MM-dd",
          );
          if (contributionMap.has(date)) {
            contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
          }
        }
      });
    }
  });

  return Array.from(contributionMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
};

export const getTaskProgress = (task: Task): number => {
  if (task.type === "simple") {
    return task.completed ? 100 : 0;
  }
  if (task.subTasks.length === 0) return 0;
  const completed = task.subTasks.filter((st) => st.completed).length;
  return Math.round((completed / task.subTasks.length) * 100);
};
