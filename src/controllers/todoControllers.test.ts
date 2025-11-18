import { addTask, getTasks } from "./todoControllers";
import { addTaskService, getTasksService } from "../services/todoService";
import { Request, Response } from "express";

jest.mock("../services/todoService", () => ({
    addTaskService: jest.fn(),
    getTasksService: jest.fn()
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
const mockGetTasksService = getTasksService as jest.Mock;
describe("getTasks Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let resStatus: jest.Mock;
    let resJson: jest.Mock;
    beforeEach(() => {
        jest.clearAllMocks();
        resStatus = jest.fn().mockReturnThis();
        resJson = jest.fn().mockReturnThis();
        mockRequest = {};
        mockResponse = {
            status: resStatus,
            json: resJson,
        };
    });
    it("should return 200 OK status and with array of tasks on success", async () => {
        const mockTasks = [{ id: "id1", name: "Yoga" }, { id: "id2", name: "Atomic habits" }];
        mockGetTasksService.mockResolvedValue(mockTasks);
        await getTasks(mockRequest as Request, mockResponse as Response);
        expect(mockGetTasksService).toHaveBeenCalledTimes(1);
        expect(resStatus).toHaveBeenCalledWith(200);
        expect(resJson).toHaveBeenCalledWith(mockTasks);
    });
    it("should return 200 OK status and an empty array if no tasks are found", async () => {
        const mockTasks: any[] = [];
        mockGetTasksService.mockResolvedValue(mockTasks);
        await getTasks(mockRequest as Request, mockResponse as Response);
        expect(mockGetTasksService).toHaveBeenCalledTimes(1);
        expect(resStatus).toHaveBeenCalledWith(200);
        expect(resJson).toHaveBeenCalledWith([]);
    });
    it("should return 500 Internal Server Error if the service fails", async () => {
        const errorMessage = "Failed to retrieve tasks from the database.";
        mockGetTasksService.mockRejectedValue(new Error(errorMessage));
        await getTasks(mockRequest as Request, mockResponse as Response);
        expect(mockGetTasksService).toHaveBeenCalledTimes(1);
        expect(resStatus).toHaveBeenCalledWith(500);
        expect(resJson).toHaveBeenCalledWith({ error: errorMessage });
    });
});
