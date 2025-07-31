import { Router } from "express";
import * as deleteController from "../controllers/delete";
import * as getController from "../controllers/get";
import * as updateController from "../controllers/update";
import { insertController } from "../controllers/insert";
import { replaceController } from "../controllers/replace";
import * as crudValidation from "../middleware/errorHandlingAndValidation/validation/crudValidation";
import {
  authenticateToken,
  requireResourceAccess,
} from "../middleware/rbac/roleAuth";

const router = Router();

// read operations
router.get(
  "/some", // get some
  authenticateToken,
  requireResourceAccess("read"),
  crudValidation.validateGetSome,
  getController.some,
);

router.get(
  "/:id", // get one
  authenticateToken,
  requireResourceAccess("read"),
  crudValidation.validateGetOne,
  getController.one,
);

router.get(
  "/", // get all
  authenticateToken,
  requireResourceAccess("read"),
  crudValidation.validateGetAll,
  getController.all,
);

// create operations
router.post(
  "/", // insert one
  authenticateToken,
  requireResourceAccess("create"),
  crudValidation.validateInsert,
  insertController,
);

// update operations
router.patch(
  "/some", // update some
  authenticateToken,
  requireResourceAccess("update"),
  crudValidation.validateUpdateSome,
  updateController.some,
);

router.patch(
  "/:id", // update one
  authenticateToken,
  requireResourceAccess("update"),
  crudValidation.validateUpdateOne,
  updateController.one,
);

router.patch(
  "/", // update all
  authenticateToken,
  requireResourceAccess("update"),
  crudValidation.validateUpdateAll,
  updateController.all,
);

// replace operations
router.put(
  "/:id", // replace one
  authenticateToken,
  requireResourceAccess("update"),
  crudValidation.validateReplace,
  replaceController,
);

// delete operations
router.delete(
  "/some", // delete some
  authenticateToken,
  requireResourceAccess("delete"),
  crudValidation.validateDeleteSome,
  deleteController.some,
);

router.delete(
  "/:id", // delete one
  authenticateToken,
  requireResourceAccess("delete"),
  crudValidation.validateDeleteOne,
  deleteController.one,
);

router.delete(
  "/", // delete all
  authenticateToken,
  requireResourceAccess("delete"),
  crudValidation.validateDeleteAll,
  deleteController.all,
);

export default router;
