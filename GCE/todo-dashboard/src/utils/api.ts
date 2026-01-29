import { type Task, type Tag, type ContributionDay } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const parseTaskDates = (task: any): Task => ({
  ...task,
  createdAt: new Date(task.createdAt),
  completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
  subTasks: task.subTasks || [],
});

const parseTagDates = (tag: any): Tag => ({
  ...tag,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || `HTTP error ${response.status}`);
  }
  return response.json();
};

export const fetchTasks = async (params?: {
  status?: "all" | "active" | "completed";
  archived?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<{
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.archived !== undefined)
    searchParams.set("archived", String(params.archived));
  if (params?.tags?.length) searchParams.set("tags", params.tags.join(","));
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`${API_BASE_URL}/tasks?${searchParams}`);
  const result = await handleResponse<{ data: any[]; pagination: any }>(
    response,
  );
  return {
    data: result.data.map(parseTaskDates),
    pagination: result.pagination,
  };
};

export const fetchTask = async (taskId: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const createTask = async (task: {
  title: string;
  type: "simple" | "advanced";
  tags?: string[];
  subTasks?: { title: string }[];
}): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const updateTask = async (
  taskId: string,
  updates: {
    title?: string;
    completed?: boolean;
    archived?: boolean;
    tags?: string[];
  },
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.status}`);
  }
};

export const toggleTask = async (taskId: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
    method: "PATCH",
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const archiveTask = async (taskId: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/archive`, {
    method: "PATCH",
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const restoreTask = async (taskId: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/restore`, {
    method: "PATCH",
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

// ============ SubTasks API ============

export const addSubTask = async (
  taskId: string,
  title: string,
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const toggleSubTask = async (
  taskId: string,
  subTaskId: string,
): Promise<Task> => {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/subtasks/${subTaskId}/toggle`,
    {
      method: "PATCH",
    },
  );
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const deleteSubTask = async (
  taskId: string,
  subTaskId: string,
): Promise<Task> => {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/subtasks/${subTaskId}`,
    {
      method: "DELETE",
    },
  );
  const result = await handleResponse<{ data: any }>(response);
  return parseTaskDates(result.data);
};

export const fetchTags = async (): Promise<Tag[]> => {
  const response = await fetch(`${API_BASE_URL}/tags`);
  const result = await handleResponse<{ data: any[] }>(response);
  return result.data.map(parseTagDates);
};

export const fetchTag = async (tagId: string): Promise<Tag> => {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`);
  const result = await handleResponse<{ data: any }>(response);
  return parseTagDates(result.data);
};

export const createTag = async (tag: {
  name: string;
  color: string;
}): Promise<Tag> => {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tag),
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTagDates(result.data);
};

export const updateTag = async (
  tagId: string,
  updates: { name?: string; color?: string },
): Promise<Tag> => {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const result = await handleResponse<{ data: any }>(response);
  return parseTagDates(result.data);
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete tag: ${response.status}`);
  }
};

export const fetchStats = async (): Promise<{
  total: number;
  completed: number;
  active: number;
  advanced: number;
  archived: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/stats`);
  const result = await handleResponse<{ data: any }>(response);
  return result.data;
};

export const fetchContributions = async (params?: {
  startDate?: string;
  endDate?: string;
  days?: number;
}): Promise<{
  data: ContributionDay[];
  summary: {
    totalContributions: number;
    longestStreak: number;
    currentStreak: number;
  };
}> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.days) searchParams.set("days", String(params.days));

  const response = await fetch(`${API_BASE_URL}/contributions?${searchParams}`);
  return handleResponse(response);
};
