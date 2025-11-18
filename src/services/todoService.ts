import { db } from "../config/firebase";
import Task, { TaskStatus, TaskPriority } from "../types/task";

const TASK_COLLECTION = "tasks";

export const addTaskService = async (taskData: unknown): Promise<Task> => {
    
    const input = taskData as Task;
    if (!input?.name?.trim() || !input.description.trim() || !input.deadline ||!input.status ||!input.priority) {
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
