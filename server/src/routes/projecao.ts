import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { calcularProjecao, simularGasto } from '../lib/projecao';

const router = Router();

// GET /api/condominios/:id/projecao?meses=12
router.get('/:id/projecao', async (req: AuthRequest, res: Response) => {
  try {
    const condo = await prisma.condominio.findUnique({
      where: { id: req.params.id },
      include: { contasFixas: true, extras: true, entradasMensais: true },
    });

    if (!condo) {
      res.status(404).json({ erro: 'Condomínio não encontrado' });
      return;
    }

    const meses = parseInt(req.query.meses as string) || 12;
    const projecao = calcularProjecao(condo, meses);

    res.json(projecao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao calcular projeção' });
  }
});

// POST /api/condominios/:id/simular
router.post('/:id/simular', async (req: AuthRequest, res: Response) => {
  try {
    const { valor, parcelas, mesInicio } = req.body;

    if (!valor || !parcelas || !mesInicio) {
      res.status(400).json({ erro: 'Campos obrigatórios: valor, parcelas, mesInicio' });
      return;
    }

    const condo = await prisma.condominio.findUnique({
      where: { id: req.params.id },
      include: { contasFixas: true, extras: true, entradasMensais: true },
    });

    if (!condo) {
      res.status(404).json({ erro: 'Condomínio não encontrado' });
      return;
    }

    const resultado = simularGasto(condo, {
      valor: Number(valor),
      parcelas: Number(parcelas),
      mesInicio,
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao simular gasto' });
  }
});

// GET /api/condominios/:id/extras
router.get('/:id/extras', async (req: AuthRequest, res: Response) => {
  try {
    const extras = await prisma.lancamentoExtra.findMany({
      where: { condominioId: req.params.id },
      orderBy: { criadoEm: 'desc' },
    });
    res.json(extras);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar extras' });
  }
});

// POST /api/condominios/:id/extras
router.post('/:id/extras', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, valorTotal, parcelas, mesInicio, tipo } = req.body;

    if (!nome || !valorTotal || !mesInicio || !tipo) {
      res.status(400).json({ erro: 'Campos obrigatórios: nome, valorTotal, mesInicio, tipo' });
      return;
    }

    const extra = await prisma.lancamentoExtra.create({
      data: {
        condominioId: req.params.id,
        nome,
        valorTotal: Number(valorTotal),
        parcelas: Number(parcelas) || 1,
        mesInicio,
        tipo,
      },
    });

    res.status(201).json(extra);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar lançamento' });
  }
});

// DELETE /api/condominios/:id/extras/:extraId
router.delete('/:id/extras/:extraId', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.lancamentoExtra.delete({
      where: { id: req.params.extraId },
    });
    res.json({ mensagem: 'Lançamento removido' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover lançamento' });
  }
});

export default router;