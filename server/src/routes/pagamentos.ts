import { Router, Response } from 'express';
import { AuthRequest, apenasAdmin } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/condominios/:id/pagamentos?mes=2026-05
// Lista todos os pagamentos de um mês com dados da conta fixa
router.get('/:id/pagamentos', async (req: AuthRequest, res: Response) => {
  try {
    const { mes } = req.query as { mes?: string };

    // Se não informar mês, usa o mês atual
    const mesConsulta = mes ?? (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const pagamentos = await prisma.pagamentoFixo.findMany({
      where: {
        condominioId: req.params.id,
        mes: mesConsulta,
      },
      include: {
        contaFixa: true,
      },
      orderBy: [
        { valorPago: 'asc' }, // pendentes primeiro (null vem antes)
        { contaFixa: { diaVencimento: 'asc' } },
      ],
    });

    res.json(pagamentos);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar pagamentos.' });
  }
});

// POST /api/condominios/:id/pagamentos/:pagamentoId/pagar
// Marca um pagamento como pago e desconta do saldo
router.post('/:id/pagamentos/:pagamentoId/pagar', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { pagamentoId } = req.params;
    const { valorPago, observacao } = req.body as {
      valorPago?: number;
      observacao?: string;
    };

    if (!valorPago || valorPago <= 0) {
      res.status(400).json({ erro: 'Valor pago deve ser maior que zero.' });
      return;
    }

    const pagamento = await prisma.pagamentoFixo.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento || pagamento.condominioId !== req.params.id) {
      res.status(404).json({ erro: 'Pagamento não encontrado.' });
      return;
    }

    if (pagamento.valorPago !== null) {
      res.status(400).json({ erro: 'Este pagamento já foi registrado.' });
      return;
    }

    // Marca como pago
    const atualizado = await prisma.pagamentoFixo.update({
      where: { id: pagamentoId },
      data: {
        valorPago,
        dataPagamento: new Date(),
        observacao: observacao || null,
      },
      include: { contaFixa: true },
    });

    // Desconta do saldo do condomínio
    await prisma.condominio.update({
      where: { id: req.params.id },
      data: { saldo: { decrement: valorPago } },
    });

    res.json(atualizado);
  } catch {
    res.status(500).json({ erro: 'Erro ao registrar pagamento.' });
  }
});

// DELETE /api/condominios/:id/pagamentos/:pagamentoId/pagar
// Remove o registro de pagamento e estorna o saldo
router.delete('/:id/pagamentos/:pagamentoId/pagar', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { pagamentoId } = req.params;

    const pagamento = await prisma.pagamentoFixo.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento || pagamento.condominioId !== req.params.id) {
      res.status(404).json({ erro: 'Pagamento não encontrado.' });
      return;
    }

    if (pagamento.valorPago === null) {
      res.status(400).json({ erro: 'Este pagamento ainda não foi registrado.' });
      return;
    }

    // Estorna o valor no saldo
    await prisma.condominio.update({
      where: { id: req.params.id },
      data: { saldo: { increment: pagamento.valorPago } },
    });

    // Remove o registro de pagamento (volta para pendente)
    const revertido = await prisma.pagamentoFixo.update({
      where: { id: pagamentoId },
      data: {
        valorPago: null,
        dataPagamento: null,
        observacao: null,
      },
      include: { contaFixa: true },
    });

    res.json(revertido);
  } catch {
    res.status(500).json({ erro: 'Erro ao estornar pagamento.' });
  }
});

export default router;