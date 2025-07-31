import { Router } from "express";
import { getCollectionPermissions, updateCollectionPermissions } from "../controllers/collectionsPermissions";
import { validateGetPermission, validateUpdatePermissions } from "../middleware/errorHandlingAndValidation/validation/collectionPermissionValidation";
import { authenticateToken, requireAdmin } from "../middleware/rbac/roleAuth";

const router = Router();

router.get('/:collectionName/permissions', // get collection permissions
  authenticateToken,
  requireAdmin,
  validateGetPermission,
  getCollectionPermissions
);

router.put('/:collectionName/permissions', // update collection permissions
  authenticateToken,
  requireAdmin,
  validateUpdatePermissions,
  updateCollectionPermissions
);

export default router;
