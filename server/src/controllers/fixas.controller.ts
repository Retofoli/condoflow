import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

async function verificarPropriedade(condoId: string, adminId: string, res: Response): Promise<boolean> {
  const condo = await prisma.condominio.findUnique({ where: { id: condoId } });
  if (!condo) {
    res.status(404).json({ erro: 'Condomínio não encontrado.' });
    return false;
  }
  if (condo.adminId !== adminId) {
    res.status(403).json({ erro: 'Sem permissão para acessar este condomínio.' });
    return false;
  }
  return true;
}

export async function listar(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  const fixas = await prisma.contaFixa.findMany({
    where: { condominioId: id },
    orderBy: { nome: 'asc' },
  });
  res.json(fixas);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  const { nome, valor, diaVencimento, categoria } = req.body as {
    nome?: string;
    valor?: number;
    diaVencimento?: number;
    categoria?: string;
  };

  if (!nome || nome.trim().length === 0) {
    res.status(400).json({ erro: 'Nome da conta é obrigatório.' });
    return;
  }
  if (!valor || valor <= 0) {
    res.status(400).json({ erro: 'O valor deve ser maior que zero.' });
    return;
  }
  if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
    res.status(400).json({ erro: 'Dia de vencimento deve estar entre 1 e 31.' });
    return;
  }
  if (!categoria || categoria.trim().length === 0) {
    res.status(400).json({ erro: 'Categoria é obrigatória.' });
    return;
  }

  const fixa = await prisma.contaFixa.create({
    data: {
      condominioId: id,
      nome: nome.trim(),
      valor,
      diaVencimento,
      categoria: categoria.trim(),
    },
  });

  res.status(201).json(fixa);
}

export async function remover(req: Request, res: Response): Promise<void> {
  const { id, fixaId } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  const fixa = await prisma.contaFixa.findUnique({ where: { id: fixaId } });
  if (!fixa || fixa.condominioId !== id) {
    res.status(404).json({ erro: 'Conta fixa não encontrada.' });
    return;
  }

  await prisma.contaFixa.delete({ where: { id: fixaId } });
  res.json({ mensagem: 'Conta fixa removida com sucesso.' });
}
