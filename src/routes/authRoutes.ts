import { Router } from "express";
import { login, register, logout } from "../controllers/auth";
import {
  validateRegistration,
  validateLogin,
  validateToken,
  validatePasswordReset,
  validatePasswordChange,
} from "../middleware/validation/authValidation";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/register", validateRegistration, asyncHandler(register));
router.post("/login", validateLogin, asyncHandler(login));
router.post("/logout", validateToken, asyncHandler(logout));

// Optional to add
// router.post("/password-reset", validatePasswordReset, asyncHandler(passwordResetRequest));
// router.post("/password-change", validatePasswordChange, asyncHandler(passwordChangeRequest));

export default router;
