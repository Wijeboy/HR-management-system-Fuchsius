import { Router } from "express";
import { searchController } from "./search.controller.js";

const searchRouter = Router();

searchRouter.get("/", searchController.search);

export { searchRouter };
