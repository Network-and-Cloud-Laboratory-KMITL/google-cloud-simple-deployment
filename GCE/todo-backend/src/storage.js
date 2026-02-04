// In-memory storage
const storage = {
  tasks: new Map(),
  tags: new Map(),
};

// Task methods
export function getAllTasks({
  status = "all",
  archived = false,
  tags = null,
  page = 1,
  limit = 50,
}) {
  let tasks = Array.from(storage.tasks.values());

  // Filter by archived
  tasks = tasks.filter((t) => t.archived === archived);

  // Filter by status
  if (status === "active") {
    tasks = tasks.filter((t) => !t.completed);
  } else if (status === "completed") {
    tasks = tasks.filter((t) => t.completed);
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    tasks = tasks.filter((t) => tags.some((tag) => t.tags.includes(tag)));
  }

  // Sort by createdAt descending
  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = tasks.length;
  const start = (page - 1) * limit;
  const paginatedTasks = tasks.slice(start, start + limit);

  return { tasks: paginatedTasks, total };
}

export function getTask(taskId) {
  return storage.tasks.get(taskId) || null;
}

export function createTask(task) {
  storage.tasks.set(task.id, task);
  return task;
}

export function updateTask(taskId, task) {
  if (storage.tasks.has(taskId)) {
    storage.tasks.set(taskId, task);
    return task;
  }
  return null;
}

export function deleteTask(taskId) {
  return storage.tasks.delete(taskId);
}

// Tag methods
export function getAllTags() {
  return Array.from(storage.tags.values());
}

export function getTag(tagId) {
  return storage.tags.get(tagId) || null;
}

export function createTag(tag) {
  storage.tags.set(tag.id, tag);
  return tag;
}

export function updateTag(tagId, tag) {
  if (storage.tags.has(tagId)) {
    storage.tags.set(tagId, tag);
    return tag;
  }
  return null;
}

export function deleteTag(tagId) {
  return storage.tags.delete(tagId);
}

// Statistics
export function getStatistics() {
  const tasks = Array.from(storage.tasks.values());
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed && !t.archived).length,
    active: tasks.filter((t) => !t.completed && !t.archived).length,
    advanced: tasks.filter((t) => t.type === "advanced").length,
    archived: tasks.filter((t) => t.archived).length,
  };
}

export function getContributions({
  startDate = null,
  endDate = null,
  days = 365,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : today;
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const contributions = {};
  const tasks = Array.from(storage.tasks.values());

  for (const task of tasks) {
    if (task.completedAt) {
      const taskDate = new Date(task.completedAt);
      taskDate.setHours(0, 0, 0, 0);
      if (taskDate >= start && taskDate <= end) {
        const dateStr = taskDate.toISOString().split("T")[0];
        contributions[dateStr] = (contributions[dateStr] || 0) + 1;
      }
    }
  }

  const contributionList = [];
  const current = new Date(end);
  while (current >= start) {
    const dateStr = current.toISOString().split("T")[0];
    contributionList.push({
      date: dateStr,
      count: contributions[dateStr] || 0,
    });
    current.setDate(current.getDate() - 1);
  }

  const totalContributions = contributionList.reduce(
    (sum, c) => sum + c.count,
    0,
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const contrib of contributionList) {
    if (contrib.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (currentStreak === 0 && tempStreak > 0) {
        currentStreak = tempStreak;
      }
      tempStreak = 0;
    }
  }

  if (contributionList[0]?.count > 0) {
    currentStreak = tempStreak > 0 ? tempStreak : currentStreak;
  }

  return {
    data: contributionList,
    summary: { totalContributions, longestStreak, currentStreak },
  };
}
