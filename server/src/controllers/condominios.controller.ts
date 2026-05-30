import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Retorna o mês atual no formato YYYY-MM
function getMesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Include padrão: contas fixas, extras e última entrada mensal
const includeCompleto = {
  contasFixas: true,
  extras: true,
  entradasMensais: {
    orderBy: { mes: 'desc' as const },
    take: 1,
  },
};

export async function listar(req: Request, res: Response): Promise<void> {
  const condominios = await prisma.condominio.findMany({
    where: { adminId: req.user!.id },
    include: includeCompleto,
    orderBy: { criadoEm: 'desc' },
  });

  // Mapeia adicionando ultimaEntrada como campo separado
  const resultado = condominios.map((c) => ({
    ...c,
    ultimaEntrada: c.entradasMensais[0] ?? null,
    entradasMensais: undefined, // não expõe a lista completa aqui
  }));

  res.json(resultado);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, saldo, unidades, taxaMensal, fundoReserva } = req.body as {
    nome?: string;
    saldo?: number;
    unidades?: number;
    taxaMensal?: number;
    fundoReserva?: number;
  };

  if (!nome || nome.trim().length === 0) {
    res.status(400).json({ erro: 'O nome do condomínio é obrigatório.' });
    return;
  }
  if (!unidades || unidades < 1) {
    res.status(400).json({ erro: 'Número de unidades deve ser maior que zero.' });
    return;
  }
  if (taxaMensal === undefined || taxaMensal < 0) {
    res.status(400).json({ erro: 'Taxa mensal inválida.' });
    return;
  }
  if (fundoReserva === undefined || fundoReserva < 0) {
    res.status(400).json({ erro: 'Fundo de reserva inválido.' });
    return;
  }

  const condo = await prisma.condominio.create({
    data: {
      nome: nome.trim(),
      saldo: saldo ?? 0,
      unidades,
      taxaMensal,
      fundoReserva,
      adminId: req.user!.id,
    },
    include: includeCompleto,
  });

  res.status(201).json({
    ...condo,
    ultimaEntrada: condo.entradasMensais[0] ?? null,
    entradasMensais: undefined,
  });
}

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

export async function editar(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  const { nome, unidades, taxaMensal, fundoReserva } = req.body as {
    nome?: string;
    unidades?: number;
    taxaMensal?: number;
    fundoReserva?: number;
  };

  if (nome !== undefined && nome.trim().length === 0) {
    res.status(400).json({ erro: 'O nome não pode estar vazio.' });
    return;
  }
  if (unidades !== undefined && unidades < 1) {
    res.status(400).json({ erro: 'Número de unidades deve ser maior que zero.' });
    return;
  }

  const condo = await prisma.condominio.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome: nome.trim() }),
      ...(unidades !== undefined && { unidades }),
      ...(taxaMensal !== undefined && { taxaMensal }),
      ...(fundoReserva !== undefined && { fundoReserva }),
    },
    include: includeCompleto,
  });

  res.json({
    ...condo,
    ultimaEntrada: condo.entradasMensais[0] ?? null,
    entradasMensais: undefined,
  });
}

export async function remover(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  await prisma.condominio.delete({ where: { id } });
  res.json({ mensagem: 'Condomínio removido com sucesso.' });
}

export async function atualizarSaldo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!(await verificarPropriedade(id, req.user!.id, res))) return;

  const { saldo } = req.body as { saldo?: number };
  if (saldo === undefined || isNaN(saldo)) {
    res.status(400).json({ erro: 'Saldo inválido.' });
    return;
  }

  const condo = await prisma.condominio.update({
    where: { id },
    data: { saldo },
    include: includeCompleto,
  });

  res.json({
    ...condo,
    ultimaEntrada: condo.entradasMensais[0] ?? null,
    entradasMensais: undefined,
  });
}