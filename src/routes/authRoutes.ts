import { Router } from "express";
import { login, register, logout } from "../controllers/auth";
import * as authValidation from "../middleware/validation/authValidation";

const router = Router();

router.post("/register", authValidation.validateRegistration, register);
router.post("/login", authValidation.validateLogin, login);
router.post("/logout", authValidation.validateToken, logout);

// Optional to add
// router.post("/password-reset", validatePasswordReset, asyncHandler(passwordResetRequest));
// router.post("/password-change", validatePasswordChange, asyncHandler(passwordChangeRequest));

export default router;
