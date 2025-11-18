export interface Task {
    id?: string; 
    name: string;
    description: string;
    deadline: string; 
    status: TaskStatus;
    priority: TaskPriority;
}
export default Task;

export enum TaskStatus {
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
}
export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}
