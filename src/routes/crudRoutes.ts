import { Router } from 'express';
import * as deleteController from '../controllers/delete';
import * as getController from '../controllers/get';
import * as updateController from '../controllers/update';
import { insertController } from '../controllers/insert';
import { replaceController } from '../controllers/replace';

const router = Router();

router.get('/some', getController.some); // get some
router.get('/:id', getController.one); // get one
router.get('/', getController.all); // get all

router.post('/', insertController); // insert one

router.patch('/some', updateController.some); // update some
router.patch('/:id', updateController.one); // update one
router.patch('/', updateController.all); // update all

router.put('/:id', replaceController); // replace one 

router.delete('/some', deleteController.some); // delete some
router.delete('/:id', deleteController.one); // delete one
router.delete('/', deleteController.all); // delete all

export default router;
