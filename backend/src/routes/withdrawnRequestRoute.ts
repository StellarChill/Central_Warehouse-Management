import { Router } from 'express';
import { createWithdrawnRequest, listWithdrawnRequests, getWithdrawnRequest, updateWithdrawnRequest, deleteWithdrawnRequest } from '../controllers/withdrawnRequestController';

const router = Router();

router.post('/', createWithdrawnRequest);
router.get('/', listWithdrawnRequests);
router.get('/:id', getWithdrawnRequest);
router.put('/:id', updateWithdrawnRequest);
router.delete('/:id', deleteWithdrawnRequest);

export default router;
