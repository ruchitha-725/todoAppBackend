import { addTaskService, getTasksService } from "./todoService";
import { TaskStatus, TaskPriority } from "../types/task";
import { db } from "../config/firebase";

const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockLimit = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();

mockWhere.mockReturnValue({ limit: mockLimit });
mockLimit.mockReturnValue({ get: mockGet });

jest.mock("../config/firebase", () => {
  const mockCollection = jest.fn().mockImplementation(() => ({
    where: mockWhere,
    add: mockAdd,
    get: mockGet
  }));
  return { db: { collection: mockCollection } };
});

describe("addTaskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ empty: true });
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
    await expect(addTaskService(invalidData)).rejects.toThrow(
      "Missing required fields."
    );
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it("should throw a conflict error if the task name already exists", async () => {
    mockGet.mockResolvedValue({ empty: false });
    await expect(addTaskService(validTaskData)).rejects.toThrow(
      'Task with name "Reading" already exists.'
    );
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it("should throw a generic database error if saving the task fails", async () => {
    mockAdd.mockRejectedValue(new Error("Firestore connection dropped unexpectedly"));
    await expect(addTaskService(validTaskData)).rejects.toThrow(
      "Failed to save task to the database."
    );
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});
describe("getTasksService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTasksSnapshotData = [
    {
      id: "id1",
      name: "Yoga",
      description: "Exercising",
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      deadline: "2025-11-21",
    },
    {
      id: "id2",
      name: "Atomic habits",
      description: "Reading",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      deadline: "2025-11-22",
    },
  ];

  it("should return a list of tasks on successful get", async () => {
    (db.collection as jest.Mock).mockImplementation(() => ({
      get: mockGet,
    }));
    mockGet.mockResolvedValue({
      empty: false,
      docs: mockTasksSnapshotData.map(task => ({
        id: task.id,
        data: () => {
          const { id, ...dataWithoutId } = task;
          return dataWithoutId;
        }
      }))
    });
    const result = await getTasksService();
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(result).toEqual(mockTasksSnapshotData);
    expect(result.length).toBe(2);
  });
  it("should return an empty array if no tasks are found", async () => {
    (db.collection as jest.Mock).mockImplementation(() => ({
      get: mockGet,
    }));
    mockGet.mockResolvedValue({ empty: true, docs: [] });
    const result = await getTasksService();
    expect(db.collection).toHaveBeenCalledWith("tasks");
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
  it("should throw an error if the database connection fails", async () => {
    (db.collection as jest.Mock).mockImplementation(() => ({
      get: mockGet,
    }));
    mockGet.mockRejectedValue(new Error("Firestore connection lost"));
    await expect(getTasksService()).rejects.toThrow(
      "Failed to retrieve tasks from the database."
    );
    expect(db.collection).toHaveBeenCalledWith("tasks");
  });
});
