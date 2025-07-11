import { Router } from 'express';
import * as deleteController from '../controllers/delete.ts';
import * as getController from '../controllers/get.ts';
import * as updateController from '../controllers/update.ts';
import { insertController } from '../controllers/insert.ts';
import { replaceController } from '../controllers/replace.ts';

const router = Router();

router.get('/:id', getController.one); // get one
router.get('/some', getController.some); // get some
router.get('/', getController.all); // get all

router.post('/', insertController); // insert one

router.patch('/:id', updateController.one); // update one
router.patch('/some', updateController.some); // update some
router.patch('/', updateController.all); // update all

router.put('/', replaceController); // replace one 

router.delete('/:id', deleteController.one); // delete one
router.delete('/some', deleteController.some); // delete some
router.delete('/', deleteController.all); // delete all

export default router;