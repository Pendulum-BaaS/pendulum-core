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

//admin routes, require auth + admin permission
router.patch("/users/:userId/role",
  authenticateToken, //verify jwt token
  requireAdmin, // check admin access
  authValidation.validateRoleUpdate, // validate input
  updateUserRole // run controller
);

export default router;
