import { Router } from 'express';
import * as deleteController from '../controllers/delete';
import * as getController from '../controllers/get';
import * as updateController from '../controllers/update';
import { insertController } from '../controllers/insert';
import { replaceController } from '../controllers/replace';
import * as crudValidation from '../middleware/errorHandlingAndValidation/validation/crudValidation';

const router = Router();

router.get('/:id', crudValidation.validateGetOne, getController.one); // get one
router.get('/some', crudValidation.validateGetSome, getController.some); // get some
router.get('/', crudValidation.validateGetAll, getController.all); // get all

router.post('/', crudValidation.validateInsert, insertController); // insert one

router.patch('/:id', crudValidation.validateUpdateOne, updateController.one); // update one
router.patch('/some', crudValidation.validateUpdateSome, updateController.some); // update some
router.patch('/', crudValidation.validateUpdateAll, updateController.all); // update all

router.put('/:id', crudValidation.validateReplace, replaceController); // replace one 

router.delete('/:id', crudValidation.validateDeleteOne, deleteController.one); // delete one
router.delete('/some', crudValidation.validateDeleteSome, deleteController.some); // delete some
router.delete('/', crudValidation.validateDeleteAll, deleteController.all); // delete all

export default router;
