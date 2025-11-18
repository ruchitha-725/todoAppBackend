import { Router } from "express";
import { addTask, getTasks, updateTask } from "../controllers/todoControllers";

const todoRoutes = Router();

todoRoutes.post("/add", addTask);
todoRoutes.get("/all", getTasks);
todoRoutes.put("/update/:id", updateTask)

export default todoRoutes;
