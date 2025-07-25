import { Router } from "express";
import { emitController } from "../controllers";

const internalRouter = Router();
internalRouter.post("/emit", emitController);

export default internalRouter;
