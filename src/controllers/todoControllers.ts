import { Request, Response } from "express";
import { addTaskService } from "../services/todoService";

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
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

