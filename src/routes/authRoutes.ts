import { Router } from "express";
import { login, register, logout } from "../controllers/auth";
import * as authValidation from "../middleware/validation/authValidation";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/register", authValidation.validateRegistration, asyncHandler(register));
router.post("/login", authValidation.validateLogin, asyncHandler(login));
router.post("/logout", authValidation.validateToken, asyncHandler(logout));

// Optional to add
// router.post("/password-reset", validatePasswordReset, asyncHandler(passwordResetRequest));
// router.post("/password-change", validatePasswordChange, asyncHandler(passwordChangeRequest));

export default router;
