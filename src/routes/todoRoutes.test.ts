import request from 'supertest';
import express, { Express } from 'express';
import todoRoutes from './todoRoutes';
import { addTask } from '../controllers/todoControllers';

jest.mock('../controllers/todoControllers', () => ({
  addTask: jest.fn((req, res) => {
    res.status(200).json({ status: 'controller function called' });
  }),
}));

const mockedAddTask = addTask as jest.Mock;
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
});
