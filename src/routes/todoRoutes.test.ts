import request from 'supertest';
import express, { Express } from 'express';
import todoRoutes from './todoRoutes';
import { addTask, getTasks, updateTask, deleteTask } from '../controllers/todoControllers';

jest.mock('../controllers/todoControllers', () => ({
  addTask: jest.fn((req, res) => {
    res.status(200).json({ status: 'controller function called' });
  }),
  getTasks: jest.fn((req, res) => {
    res.status(200).json({ status: 'getTasks controller called' });
  }),
  updateTask: jest.fn((req, res) => {
    res.status(200).json({ status: 'updateTask controller called', id: req.params.id })
  }),
  deleteTask: jest.fn((req, res) => {
    res.status(200).json({ status: 'deleteTask controller called', id: req.params.id });
  }),
}));

const mockedAddTask = addTask as jest.Mock;
const mockedGetTasks = getTasks as jest.Mock;
const mockedUpdateTask = updateTask as jest.Mock;
const mockedDeleteTask = deleteTask as jest.Mock;

const app: Express = express();
app.use(express.json());
app.use('/tasks', todoRoutes);

describe('todoRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call the addTask controller function when POST is requested', async () => {
    const testBody = { name: "Yoga" };
    const response = await request(app)
      .post('/tasks/add')
      .send(testBody)
      .expect(200);
    expect(mockedAddTask).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ status: 'controller function called' });
    const reqArg = mockedAddTask.mock.calls[0][0];
    expect(reqArg.body).toEqual(testBody);
  });
  it('should return 404 for a route that does not exist within the router', async () => {
    await request(app)
      .get('/tasks/route')
      .expect(404);
    expect(mockedAddTask).not.toHaveBeenCalled();
  });
  it('should call the getTasks controller function when GET is requested', async () => {
    const response = await request(app)
      .get('/tasks/all')
      .expect(200);
    expect(mockedGetTasks).toHaveBeenCalledTimes(1);
    expect(mockedAddTask).not.toHaveBeenCalled();
    expect(response.body).toEqual({ status: 'getTasks controller called' });
  });
  it('should call the updateTask controller function when PUT is requested', async () => {
    const testId = 'id123';
    const testBody = { description: "Reading horror story book" };
    const response = await request(app)
      .put(`/tasks/update/${testId}`)
      .send(testBody)
      .expect(200);
    expect(mockedUpdateTask).toHaveBeenCalledTimes(1);
    expect(mockedAddTask).not.toHaveBeenCalled();
    expect(mockedGetTasks).not.toHaveBeenCalled();
    expect(response.body).toEqual({ status: 'updateTask controller called', id: testId });
    const reqArg = mockedUpdateTask.mock.calls[0][0];
    expect(reqArg.params.id).toBe(testId);
    expect(reqArg.body).toEqual(testBody);
  });
  it('should call the deleteTask controller function when DELETE is requested', async () => {
    const testId = 'id123';
    const response = await request(app)
      .delete(`/tasks/delete/${testId}`)
      .expect(200);
    expect(mockedDeleteTask).toHaveBeenCalledTimes(1);
    expect(mockedAddTask).not.toHaveBeenCalled();
    expect(mockedGetTasks).not.toHaveBeenCalled();
    expect(mockedUpdateTask).not.toHaveBeenCalled();
    expect(response.body).toEqual({ status: 'deleteTask controller called', id: testId });
    const reqArg = mockedDeleteTask.mock.calls[0][0];
    expect(reqArg.params.id).toBe(testId);
  });
});
