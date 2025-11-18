import { Router } from "express";
import { addTask, getTasks, updateTask, deleteTask } from "../controllers/todoControllers";

const todoRoutes = Router();

todoRoutes.post("/add", addTask);
todoRoutes.get("/all", getTasks);
todoRoutes.put("/update/:id", updateTask)
todoRoutes.delete("/delete/:id", deleteTask);

export default todoRoutes;
