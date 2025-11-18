import { addTaskService } from "./todoService";
import { TaskStatus, TaskPriority } from "../types/task";

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
