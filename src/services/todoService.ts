import { db } from "../config/firebase";
import Task, { TaskStatus, TaskPriority } from "../types/task";

const TASK_COLLECTION = "tasks";

export const addTaskService = async (taskData: unknown): Promise<Task> => {

  const input = taskData as Task;
  if (!input?.name?.trim() || !input.description.trim() || !input.deadline || !input.status || !input.priority) {
    throw new Error("Missing required fields.");
  }
  if (!Object.values(TaskStatus).includes(input.status)) {
    throw new Error(`status must be one of ${Object.values(TaskStatus).join(', ')}.`);
  }
  if (!Object.values(TaskPriority).includes(input.priority)) {
    throw new Error(`priority must be one of ${Object.values(TaskPriority).join(', ')}.`);
  }
  input.name = input.name.trim();
  input.description = input.description.trim();
  try {
    const existing = await db.collection(TASK_COLLECTION)
      .where('name', '==', input.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new Error(`Task with name "${input.name}" already exists.`);
    }
    const { id, ...dataToStore } = input;
    const docRef = await db.collection(TASK_COLLECTION).add(dataToStore);
    return { ...dataToStore, id: docRef.id };

  } catch (error) {
    if ((error as Error).message.includes("Task with name")) {
      throw error;
    }
    throw new Error("Failed to save task to the database.");
  }
};

export const getTasksService = async (): Promise<Task[]> => {
  try {
    const snapshot = await db.collection(TASK_COLLECTION).get();
    if (snapshot.empty) {
      return [];
    }
    const tasks = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      } as Task;
    });
    return tasks;
  } catch (error) {
    throw new Error("Failed to retrieve tasks from the database.");
  }
};
export const updateTaskService = async (id: string, data: Partial<Task>): Promise<Partial<Task>> => {
  if (!id || typeof id !== 'string') {
    throw new Error("Valid task ID is required for updating.");
  }
  const allowedUpdateFields = ['description', 'status', 'priority', 'deadline'];
  const updateKeys = Object.keys(data);
  const invalidFields = updateKeys.filter(key => !allowedUpdateFields.includes(key));
  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields provided for update: ${invalidFields.join(', ')}.`);
  }
  if (updateKeys.length === 0) {
    throw new Error("No valid fields provided for update.");
  }
  if (data.status && !Object.values(TaskStatus).includes(data.status)) {
    throw new Error(`Status must be one of ${Object.values(TaskStatus).join(', ')}.`);
  }
  if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
    throw new Error(`Priority must be one of ${Object.values(TaskPriority).join(', ')}.`);
  }
  try {
    const docRef = db.collection(TASK_COLLECTION).doc(id);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      throw new Error(`Task with ID "${id}" does not exist.`);
    }
    await docRef.update(data);
    return { id, ...data };
  } catch (error) {
    if ((error as Error).message.includes("does not exist.")) {
      throw error;
    }
    throw new Error("Failed to update task in the database.");
  }
};
export const deleteTaskService = async (id: string): Promise<{ success: boolean }> => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error("Valid task ID is required for deletion.");
  }
  try {
    const docRef = db.collection(TASK_COLLECTION).doc(id);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      throw new Error(`Task with ID "${id}" does not exist.`);
    }
    await docRef.delete();
    return { success: true };
  } catch (error) {
    if ((error as Error).message.includes("does not exist")) {
      throw error;
    }
    throw new Error("Failed to delete task from the database.");
  }
};


