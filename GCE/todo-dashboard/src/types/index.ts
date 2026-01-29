export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface BaseTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
  archived?: boolean;
}

export interface SimpleTask extends BaseTask {
  type: "simple";
}

export interface AdvancedTask extends BaseTask {
  type: "advanced";
  subTasks: SubTask[];
}

export type Task = SimpleTask | AdvancedTask;

export interface ContributionDay {
  date: string;
  count: number;
}
