import { Router } from "express";
import { emitController } from "../controllers";

const router = Router();
router.post("/emit", emitController);

export default router;
