import { Router } from 'express';
import * as deleteController from '../controllers/delete';
import * as getController from '../controllers/get';
import * as updateController from '../controllers/update';
import { insertController } from '../controllers/insert';
import { replaceController } from '../controllers/replace';
import * as crudValidation from '../middleware/errorHandlingAndValidation/validation/crudValidation';
import { authenticateToken, requireResourceAccess } from '../middleware/roleAuth';

const router = Router();

// read operations
router.get('/:id', // get one
  authenticateToken,
  requireResourceAccess('read'),
  crudValidation.validateGetOne,
  getController.one
);

router.get('/some', // get some
  authenticateToken,
  requireResourceAccess('read'),
  crudValidation.validateGetSome,
  getController.some
);

router.get('/', // get all
  authenticateToken,
  requireResourceAccess('read'),
  crudValidation.validateGetAll,
  getController.all
);

// create operations
router.post('/', // insert one
  authenticateToken,
  requireResourceAccess('write'),
  crudValidation.validateInsert,
  insertController
);

// update operations
router.patch('/:id', // update one
  authenticateToken,
  requireResourceAccess('write'),
  crudValidation.validateUpdateOne,
  updateController.one
);

router.patch('/some',// update some
  authenticateToken,
  requireResourceAccess('write'),
  crudValidation.validateUpdateSome,
  updateController.some
);

router.patch('/', // update all
  authenticateToken,
  requireResourceAccess('write'),
  crudValidation.validateUpdateAll,
  updateController.all
);

// replace operations
router.put('/:id', // replace one
  authenticateToken,
  requireResourceAccess('write'),
  crudValidation.validateReplace,
  replaceController
);

// delete operations
router.delete('/:id', // delete one
  authenticateToken,
  requireResourceAccess('delete'),
  crudValidation.validateDeleteOne,
  deleteController.one
);

router.delete('/some', // delete some
  authenticateToken,
  requireResourceAccess('delete'),
  crudValidation.validateDeleteSome,
  deleteController.some
);

router.delete('/', // delete all
  authenticateToken,
  requireResourceAccess('delete'),
  crudValidation.validateDeleteAll,
  deleteController.all
);

export default router;
