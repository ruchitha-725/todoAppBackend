import { addTaskService, getTasksService, updateTaskService, deleteTaskService } from "./todoService";
import { TaskStatus, TaskPriority } from "../types/task";
import { db } from "../config/firebase";

let mockAdd: jest.Mock;
let mockGet: jest.Mock;
let mockWhere: jest.Mock;
let mockLimit: jest.Mock;
let mockUpdate: jest.Mock;
let mockDoc: jest.Mock;

jest.mock("../config/firebase", () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe("addTaskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn();
    mockGet = jest.fn().mockResolvedValue({ empty: true });
    mockWhere = jest.fn().mockReturnThis();
    mockLimit = jest.fn().mockReturnThis();

    (db.collection as jest.Mock).mockImplementation(() => ({
      where: mockWhere,
      limit: mockLimit,
      get: mockGet,
      add: mockAdd,
    }));
  });

  const validTaskData = {
    name: "Reading",
    description: "Story book reading",
    status: TaskStatus.PENDING,
    priority: TaskPriority.LOW,
    deadline: "2025-11-21",
  };
  it("should successfully add a unique task", async () => {
    mockAdd.mockResolvedValue({ id: "id123" });
    const result = await addTaskService(validTaskData);
    expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Reading');
    const expectedDataStored = { ...validTaskData, name: "Reading", description: "Story book reading" };
    expect(mockAdd).toHaveBeenCalledWith(expectedDataStored);
    expect(result).toEqual({ ...expectedDataStored, id: "id123" });
  });
  it("should throw an error if validation fails", async () => {
    const invalidData = { ...validTaskData, name: "  " };
    await expect(addTaskService(invalidData)).rejects.toThrow("Missing required fields.");
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it("should throw a conflict error if the task name already exists", async () => {
    mockGet.mockResolvedValue({ empty: false });
    await expect(addTaskService(validTaskData)).rejects.toThrow('Task with name "Reading" already exists.');
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it("should throw a generic database error if saving the task fails", async () => {
    mockAdd.mockRejectedValue(new Error("Firestore connection dropped unexpectedly"));
    await expect(addTaskService(validTaskData)).rejects.toThrow("Failed to save task to the database.");
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});
describe("getTasksService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    (db.collection as jest.Mock).mockImplementation(() => ({
      get: mockGet,
    }));
  });
  const mockTasksSnapshotData = [
    { id: "id1", name: "Yoga", description: "Exercising", status: TaskStatus.PENDING, priority: TaskPriority.LOW, deadline: "2025-11-21" },
    { id: "id2", name: "Atomic habits", description: "Reading", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, deadline: "2025-11-22" },
  ];
  it("should return a list of tasks on successful get", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      docs: mockTasksSnapshotData.map(task => ({
        id: task.id,
        data: () => { const { id, ...dataWithoutId } = task; return dataWithoutId; }
      }))
    });
    const result = await getTasksService();
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(result).toEqual(mockTasksSnapshotData);
    expect(result.length).toBe(2);
  });
  it("should return an empty array if no tasks are found", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });
    const result = await getTasksService();
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
  it("should throw an error if the database connection fails", async () => {
    mockGet.mockRejectedValue(new Error("Firestore connection lost"));
    await expect(getTasksService()).rejects.toThrow("Failed to retrieve tasks from the database.");
    expect(db.collection).toHaveBeenCalledWith("tasks");
  });
});
describe("updateTaskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ name: 'Existing Task' }) });
    mockUpdate = jest.fn().mockResolvedValue(undefined);
    mockDoc = jest.fn().mockReturnThis();
    (db.collection as jest.Mock).mockImplementation(() => ({
      doc: mockDoc,
    }));
    mockDoc.mockReturnValue({
      get: mockGet,
      update: mockUpdate,
    });
  });
  const validTaskId = "id123";
  const validUpdateData = {
    description: "Reading the books",
    status: TaskStatus.IN_PROGRESS,
  };
  it("should successfully update a task with valid data", async () => {
    const result = await updateTaskService(validTaskId, validUpdateData);
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(mockDoc).toHaveBeenCalledWith(validTaskId);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(validUpdateData);
    expect(result).toEqual({ id: validTaskId, ...validUpdateData });
  });
  it("should throw an error if the task ID is missing", async () => {
    await expect(updateTaskService("", validUpdateData)).rejects.toThrow("Valid task ID is required for updating.");
    expect(db.collection).not.toHaveBeenCalled();
  });
  it("should throw an error for invalid update fields", async () => {
    const invalidData = { ...validUpdateData, name: "Cannot change name" };
    await expect(updateTaskService(validTaskId, invalidData as any)).rejects.toThrow("Invalid fields provided for update: name.");
    expect(mockDoc).not.toHaveBeenCalled();
  });
  it("should throw an error for an invalid status value", async () => {
    const invalidData = { status: "InvalidStatusValue" as any };
    await expect(updateTaskService(validTaskId, invalidData)).rejects.toThrow(/Status must be one of/);
    expect(mockDoc).not.toHaveBeenCalled();
  });
  it("should throw an error if the task does not exist", async () => {
    mockGet.mockResolvedValue({ exists: false });
    await expect(updateTaskService(validTaskId, validUpdateData)).rejects.toThrow(`Task with ID "${validTaskId}" does not exist.`);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("should throw a database error if the update operation fails", async () => {
    mockUpdate.mockRejectedValue(new Error("Firestore connection dropped"));
    await expect(updateTaskService(validTaskId, validUpdateData)).rejects.toThrow("Failed to update task in the database.");
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
describe("deleteTaskService", () => {
  let mockDelete: jest.Mock;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  const validTaskId = "id123";
  beforeEach(() => {
    jest.clearAllMocks();
    mockDelete = jest.fn().mockResolvedValue(undefined);
    mockGet = jest.fn().mockResolvedValue({ exists: true });
    mockDoc = jest.fn().mockReturnThis();
    (db.collection as jest.Mock).mockImplementation(() => ({
      doc: mockDoc,
    }));
    mockDoc.mockReturnValue({
      get: mockGet,
      delete: mockDelete,
    });
  });
  it("should successfully delete a task if it exists", async () => {
    const result = await deleteTaskService(validTaskId);
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(mockDoc).toHaveBeenCalledWith(validTaskId);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
  it("should throw an error if the task ID is missing or invalid", async () => {
    await expect(deleteTaskService("")).rejects.toThrow(
      "Valid task ID is required for deletion."
    );
    expect(db.collection).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("should throw a Task does not exist error if the task is not found", async () => {
    mockGet.mockResolvedValue({ exists: false });
    await expect(deleteTaskService(validTaskId)).rejects.toThrow(`Task with ID "${validTaskId}" does not exist.`);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it("should throw a database error if the delete operation fails unexpectedly", async () => {
    mockGet.mockResolvedValue({ exists: true });
    mockDelete.mockRejectedValue(new Error("Firestore connection dropped"));
    await expect(deleteTaskService(validTaskId)).rejects.toThrow("Failed to delete task from the database.");
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

