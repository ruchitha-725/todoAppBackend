import { Request, Response } from "express";
import { addTaskService, getTasksService, updateTaskService, deleteTaskService } from "../services/todoService";

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

export const addTask = async (req: Request, res: Response) => {
    try {
        const task = await addTaskService(req.body);
        res.status(201).json(task);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage.startsWith("Missing required fields.") ||
            errorMessage.includes("status must be one of") ||
            errorMessage.includes("priority must be one of")) {
            res.status(400).json({ error: errorMessage });
        }
        else if (errorMessage.includes("Task with name")) {
            res.status(409).json({ error: errorMessage });
        }
        else if (errorMessage.startsWith("Failed to save task")) {
            res.status(500).json({ error: errorMessage });
        }
        else {
            res.status(500).json({ error: "An unexpected error occurred." });
        }
    }
};
export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await getTasksService();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
export const updateTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updated = await updateTaskService(id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage.startsWith("Valid task ID is required") ||
            errorMessage.includes("Invalid fields provided") ||
            errorMessage.includes("No valid fields provided") ||
            errorMessage.includes("must be one of")) {
            res.status(400).json({ error: errorMessage });
        }
        else if (errorMessage.includes("does not exist")) {
            res.status(404).json({ error: errorMessage });
        }
        else {
            res.status(500).json({ error: "Failed to update task in the database." });
        }
    }
};
export const deleteTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await deleteTaskService(id);
        res.status(200).json({ message: "Task deleted" });
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage.startsWith("Valid task ID is required")) {
            res.status(400).json({ error: errorMessage });
        }
        else if (errorMessage.includes("does not exist")) {
            res.status(404).json({ error: errorMessage });
        }
        else {
            res.status(500).json({ error: "Failed to delete task from the database." });
        }
    }
};