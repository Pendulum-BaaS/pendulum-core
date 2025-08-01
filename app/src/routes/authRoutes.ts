import { Router } from "express";
import { login, register, logout, updateUserRole, getCurrentUser, validateAdminKey } from "../controllers/auth";
import * as authValidation from "../middleware/errorHandlingAndValidation/validation/userValidation";
import { validateAdminKeyRequest } from "../middleware/errorHandlingAndValidation/validation/adminValidation";
import { authenticateToken, requireAdmin } from "../middleware/rbac/roleAuth";

const router = Router();

// public routes, no auth required
router.post("/register", authValidation.validateRegistration, register);
router.post("/login", authValidation.validateLogin, login);

// admin validation route for dashboard acces (no auth required)
router.post("/admin/validate", validateAdminKeyRequest, validateAdminKey);

// auth routes, require JWT token
router.get("/me", authenticateToken, getCurrentUser);
router.post("/logout", authenticateToken, logout);
// Optional to add
// router.post("/password-reset", validatePasswordReset, asyncHandler(passwordResetRequest));
// router.post("/password-change", validatePasswordChange, asyncHandler(passwordChangeRequest));

//admin routes, require auth + admin permission
router.patch("/users/:userId/role",
  authenticateToken, //verify jwt token
  requireAdmin, // check admin access
  authValidation.validateRoleUpdate, // validate input
  updateUserRole // run controller (NEED TO MAKE)
);

// FUTURE ADMIN ROUTES
// router.get("/users", authenticateToken, requireAdmin, getAllUsers);
// router.delete("/users/:userId", authenticateToken,  requireAdmin, deleteUser);

export default router;
