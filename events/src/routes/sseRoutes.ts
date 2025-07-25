import { Router } from "express";
import eventsController from "./controllers";

const sseRouter = Router();
sseRouter.use("/");

export default sseRouter;
