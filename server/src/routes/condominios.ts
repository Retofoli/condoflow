import { Router } from 'express';
import { listar, criar, editar, remover, atualizarSaldo } from '../controllers/condominios.controller';
import { listar as listarFixas, criar as criarFixa, remover as removerFixa } from '../controllers/fixas.controller';
import { autenticar, apenasAdmin } from '../middleware/auth';

const router = Router();

router.use(autenticar);

router.get('/', listar);
router.post('/', apenasAdmin, criar);
router.put('/:id', apenasAdmin, editar);
router.delete('/:id', apenasAdmin, remover);
router.patch('/:id/saldo', apenasAdmin, atualizarSaldo);

router.get('/:id/fixas', listarFixas);
router.post('/:id/fixas', apenasAdmin, criarFixa);
router.delete('/:id/fixas/:fixaId', apenasAdmin, removerFixa);

export default router;
