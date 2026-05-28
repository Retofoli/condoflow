import { Router, Response } from 'express';
import { AuthRequest, apenasAdmin } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/condominios/:id/entradas
router.get('/:id/entradas', async (req: AuthRequest, res: Response) => {
  try {
    const entradas = await prisma.entradaMensal.findMany({
      where: { condominioId: req.params.id },
      orderBy: { mes: 'desc' },
    });
    res.json(entradas);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar entradas' });
  }
});

// POST /api/condominios/:id/entradas
router.post('/:id/entradas', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { mes, valor, observacao } = req.body;

    if (!mes || !valor) {
      res.status(400).json({ erro: 'Campos obrigatórios: mes, valor' });
      return;
    }

    const novoValor = Number(valor);

    // Verifica se já existe entrada para esse mês
    const entradaExistente = await prisma.entradaMensal.findUnique({
      where: {
        condominioId_mes: {
          condominioId: req.params.id,
          mes,
        },
      },
    });

    // Calcula o ajuste do saldo:
    // - Se é nova entrada: soma o valor inteiro
    // - Se é atualização: soma apenas a diferença (novo - antigo)
    const ajusteSaldo = entradaExistente
      ? novoValor - entradaExistente.valor
      : novoValor;

    const entrada = await prisma.entradaMensal.upsert({
      where: {
        condominioId_mes: {
          condominioId: req.params.id,
          mes,
        },
      },
      update: {
        valor: novoValor,
        observacao: observacao || null,
      },
      create: {
        condominioId: req.params.id,
        mes,
        valor: novoValor,
        observacao: observacao || null,
      },
    });

    // Aplica apenas a diferença no saldo — corrige o bug do increment sempre somando tudo
    if (ajusteSaldo !== 0) {
      await prisma.condominio.update({
        where: { id: req.params.id },
        data: { saldo: { increment: ajusteSaldo } },
      });
    }

    res.status(201).json(entrada);
  } catch {
    res.status(500).json({ erro: 'Erro ao lançar entrada' });
  }
});

// DELETE /api/condominios/:id/entradas/:entradaId
router.delete('/:id/entradas/:entradaId', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const entrada = await prisma.entradaMensal.findUnique({
      where: { id: req.params.entradaId },
    });

    if (!entrada) {
      res.status(404).json({ erro: 'Entrada não encontrada' });
      return;
    }

    await prisma.entradaMensal.delete({
      where: { id: req.params.entradaId },
    });

    // Reverte exatamente o valor que estava salvo — saldo sempre consistente
    await prisma.condominio.update({
      where: { id: req.params.id },
      data: { saldo: { decrement: entrada.valor } },
    });

    res.json({ mensagem: 'Entrada removida' });
  } catch {
    res.status(500).json({ erro: 'Erro ao remover entrada' });
  }
});

// GET /api/condominios/pendentes/mes — condomínios sem entrada no mês atual
router.get('/pendentes/mes', async (req: AuthRequest, res: Response) => {
  try {
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const diaAtual = agora.getDate();

    const condominios = await prisma.condominio.findMany({
      where: { adminId: req.user!.id },
      include: {
        entradasMensais: {
          where: { mes: mesAtual },
        },
      },
    });

    const pendentes = condominios.filter(c =>
      c.entradasMensais.length === 0 && diaAtual > c.diaArrecadacao
    );

    res.json(pendentes.map(c => ({
      id: c.id,
      nome: c.nome,
      diaArrecadacao: c.diaArrecadacao,
      mesAtual,
    })));
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar pendentes' });
  }
});

export default router;
