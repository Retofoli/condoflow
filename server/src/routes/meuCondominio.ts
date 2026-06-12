import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { resumo, projecao, margem, simular } from '../controllers/meuCondominio.controller';
import { autenticar } from '../middleware/auth';

const router = Router();

// Middleware local: só síndicos passam daqui
function apenasSindico(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.perfil !== 'SINDICO') {
    res.status(403).json({ erro: 'Acesso restrito a síndicos.' });
    return;
  }
  next();
}

router.use(autenticar, apenasSindico);
router.get('/', resumo);
router.get('/projecao', projecao);
router.get('/margem', margem);
router.post('/simular', simular);

export default router;