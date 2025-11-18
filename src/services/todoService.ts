import { db } from "../config/firebase";
import Task from "../types/task";

const TASK_COLLECTION = "tasks";

export const addTaskService = async (taskData: Omit<Task, 'id'>): Promise<Task> => {
  const docRef = await db.collection(TASK_COLLECTION).add(taskData);
  const newTask: Task = { id: docRef.id, ...taskData };  
  return newTask;
};

