import { Router } from 'express';
import * as deleteController from '../controllers/delete';
import * as getController from '../controllers/get';
import * as updateController from '../controllers/update';
import { insertController } from '../controllers/insert';
import { replaceController } from '../controllers/replace';
import * as crudValidation from '../middleware/validation/crudValidation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/:id', crudValidation.validateGetOne, asyncHandler(getController.one)); // get one
router.get('/some', crudValidation.validateGetSome, asyncHandler(getController.some)); // get some
router.get('/', crudValidation.validateGetAll, asyncHandler(getController.all)); // get all

router.post('/', crudValidation.validateInsert, asyncHandler(insertController)); // insert one

router.patch('/:id', crudValidation.validateUpdateOne, asyncHandler(updateController.one)); // update one
router.patch('/some', crudValidation.validateUpdateSome, asyncHandler(updateController.some)); // update some
router.patch('/', crudValidation.validateUpdateAll, asyncHandler(updateController.all)); // update all

router.put('/:id', crudValidation.validateReplace, asyncHandler(replaceController)); // replace one 

router.delete('/:id', crudValidation.validateDeleteOne, asyncHandler(deleteController.one)); // delete one
router.delete('/some', crudValidation.validateDeleteSome, asyncHandler(deleteController.some)); // delete some
router.delete('/', crudValidation.validateDeleteAll, asyncHandler(deleteController.all)); // delete all

export default router;
