export interface TaskData {
  title: string;
  description?: string;
  parentId?: string;
  startAt: string;
  endAt: string;
  completedAt?: string;
  priority: number;
}
