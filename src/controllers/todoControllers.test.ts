import { addTask } from "./todoControllers";
import { addTaskService } from "../services/todoService";
import { Request, Response } from "express";

jest.mock("../services/todoService", () => ({
    addTaskService: jest.fn(),
}));

const mockAddTaskService = addTaskService as jest.Mock;

describe("addTask Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let resStatus: jest.Mock;
    let resJson: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        resStatus = jest.fn().mockReturnThis();
        resJson = jest.fn().mockReturnThis();
        mockRequest = {
            body: {},
        };
        mockResponse = {
            status: resStatus,
            json: resJson,
        };
    });

    it("should return 201 Created status on success", async () => {
        const createdTask = { id: "id123", name: "Yoga" };
        mockAddTaskService.mockResolvedValue(createdTask);
        await addTask(mockRequest as Request, mockResponse as Response);
        expect(resStatus).toHaveBeenCalledWith(201);
        expect(resJson).toHaveBeenCalledWith(createdTask);
    });

    it("should return 400 Bad Request for a validation error", async () => {
        const errorMessage = "Missing required fields.";
        mockAddTaskService.mockRejectedValue(new Error(errorMessage));
        await addTask(mockRequest as Request, mockResponse as Response);
        expect(resStatus).toHaveBeenCalledWith(400);
        expect(resJson).toHaveBeenCalledWith({ error: errorMessage });
    });
    it("should return 409 error", async () => {
        const errorMessage = 'Task with name "Reading" already exists.';
        mockAddTaskService.mockRejectedValue(new Error(errorMessage));
        await addTask(mockRequest as Request, mockResponse as Response);
        expect(resStatus).toHaveBeenCalledWith(409);
        expect(resJson).toHaveBeenCalledWith({ error: errorMessage });
    });
    it("should return 500 Server Error for a database failure", async () => {
        const errorMessage = "Failed to save task to the database.";
        mockAddTaskService.mockRejectedValue(new Error(errorMessage));
        await addTask(mockRequest as Request, mockResponse as Response);
        expect(resStatus).toHaveBeenCalledWith(500);
        expect(resJson).toHaveBeenCalledWith({ error: errorMessage });
    });
});
