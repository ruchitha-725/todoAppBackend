import { Router } from "express";
import { addTask, getTasks } from "../controllers/todoControllers";

const todoRoutes = Router();

todoRoutes.post("/add", addTask);
todoRoutes.get("/all", getTasks);

export default todoRoutes;
