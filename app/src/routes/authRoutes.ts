import { Router } from "express";
import { login, register, logout, updateUserRole, getCurrentUser } from "../controllers/auth";
import * as authValidation from "../middleware/errorHandlingAndValidation/validation/authValidation";
import { authenticateToken, requireManagementAccess } from "../middleware/rbac/roleAuth";

const router = Router();

// public routes, no auth required
router.post("/register", authValidation.validateRegistration, register);
router.post("/login", authValidation.validateLogin, login);

// auth routes, require JWT token
router.get("/me", authenticateToken, getCurrentUser);
router.post("/logout", authenticateToken, logout);
// Optional to add
// router.post("/password-reset", validatePasswordReset, asyncHandler(passwordResetRequest));
// router.post("/password-change", validatePasswordChange, asyncHandler(passwordChangeRequest));

//admin routes, require auth + admin permission
router.patch("/users/:userId/role",
  authenticateToken, //verify jwt token
  requireManagementAccess('users'), // check management access
  authValidation.validateRoleUpdate, // validate input
  updateUserRole // run controller (NEED TO MAKE)
);

// FUTURE ADMIN ROUTES
// router.get("/users", authenticateToken, requireManagementAccess('users'), getAllUsers);
// router.delete("/users/:userId", authenticateToken,  requireManagementAccess('users'), deleteUser);

export default router;
