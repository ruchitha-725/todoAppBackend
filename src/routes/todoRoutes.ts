import { Router } from "express";
import { addTask } from "../controllers/todoControllers";

const todoRoutes = Router();

todoRoutes.post("/add", addTask);


export default todoRoutes;
