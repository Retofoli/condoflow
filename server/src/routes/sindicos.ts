import { Router } from 'express';
import { listar, criar, remover } from '../controllers/sindicos.controller';
import { autenticar, apenasAdmin } from '../middleware/auth';

const router = Router();

router.use(autenticar, apenasAdmin);
router.get('/', listar);
router.post('/', criar);
router.delete('/:id', remover);

export default router;