import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calcularProjecao, calcularMargem, simularGasto } from '../lib/projecao';

function getMesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Busca o condomínio do síndico logado, com tudo que os cálculos precisam
async function condominioDoSindico(usuarioId: string) {
  return prisma.condominio.findFirst({
    where: { sindicoId: usuarioId },
    include: {
      contasFixas: true,
      extras: true,
      entradasMensais: true,
      pagamentosFixos: true,
    },
  });
}

// GET /api/meu-condominio — resumo financeiro do mês
export async function resumo(req: Request, res: Response): Promise<void> {
  const mes = getMesAtual();
  const condominio = await condominioDoSindico(req.user!.id);

  if (!condominio) {
    res.status(404).json({ erro: 'Nenhum condomínio associado ao seu usuário.' });
    return;
  }

  const entradaMes = condominio.entradasMensais.find(e => e.mes === mes)?.valor ?? 0;

  const pagamentosDoMes = condominio.pagamentosFixos.filter(p => p.mes === mes);
  const saidaPrevistaMes = pagamentosDoMes.reduce((acc, p) => acc + p.valorPrevisto, 0);
  const saidaPagaMes = pagamentosDoMes
    .filter(p => p.valorPago !== null)
    .reduce((acc, p) => acc + (p.valorPago ?? 0), 0);

  res.json({
    condominio: { id: condominio.id, nome: condominio.nome, saldo: condominio.saldo, fundoReserva: condominio.fundoReserva },
    mes,
    entradaMes,
    saidaPrevistaMes,
    saidaPagaMes,
    resultadoMes: Number((entradaMes - saidaPrevistaMes).toFixed(2)),
  });
}

// GET /api/meu-condominio/projecao — 12 meses à frente
export async function projecao(req: Request, res: Response): Promise<void> {
  const condominio = await condominioDoSindico(req.user!.id);

  if (!condominio) {
    res.status(404).json({ erro: 'Nenhum condomínio associado ao seu usuário.' });
    return;
  }

  res.json(calcularProjecao(condominio));
}

// GET /api/meu-condominio/margem — quanto pode gastar sem ficar no vermelho
export async function margem(req: Request, res: Response): Promise<void> {
  const condominio = await condominioDoSindico(req.user!.id);

  if (!condominio) {
    res.status(404).json({ erro: 'Nenhum condomínio associado ao seu usuário.' });
    return;
  }

  res.json(calcularMargem(condominio));
}

// POST /api/meu-condominio/simular — testa um gasto antes de decidir
export async function simular(req: Request, res: Response): Promise<void> {
  const { valor, parcelas, mesInicio } = req.body;

  if (!valor || !mesInicio) {
    res.status(400).json({ erro: 'Campos obrigatórios: valor e mesInicio.' });
    return;
  }

  const condominio = await condominioDoSindico(req.user!.id);

  if (!condominio) {
    res.status(404).json({ erro: 'Nenhum condomínio associado ao seu usuário.' });
    return;
  }

  const resultado = simularGasto(condominio, {
    valor: Number(valor),
    parcelas: Number(parcelas) || 1,
    mesInicio,
  });

  res.json(resultado);
}