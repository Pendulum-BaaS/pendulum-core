import { Router } from "express";
import { eventsController } from "../controllers";

const router = Router();
router.get("/", eventsController);

export default router;
