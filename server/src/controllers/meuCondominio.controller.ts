import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function getMesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Resumo financeiro do condomínio do síndico logado
export async function resumo(req: Request, res: Response): Promise<void> {
  const mes = getMesAtual();

  // Busca o condomínio em que o usuário logado é o síndico
  const condominio = await prisma.condominio.findFirst({
    where: { sindicoId: req.user!.id },
    include: {
      entradasMensais: { where: { mes } },
      pagamentosFixos: { where: { mes } },
    },
  });

  if (!condominio) {
    res.status(404).json({ erro: 'Nenhum condomínio associado ao seu usuário.' });
    return;
  }

  const entradaMes = condominio.entradasMensais[0]?.valor ?? 0;

  const saidaPrevistaMes = condominio.pagamentosFixos
    .reduce((acc, p) => acc + p.valorPrevisto, 0);

  const saidaPagaMes = condominio.pagamentosFixos
    .filter(p => p.valorPago !== null)
    .reduce((acc, p) => acc + (p.valorPago ?? 0), 0);

  res.json({
    condominio: { id: condominio.id, nome: condominio.nome, saldo: condominio.saldo },
    mes,
    entradaMes,
    saidaPrevistaMes,
    saidaPagaMes,
    resultadoMes: Number((entradaMes - saidaPrevistaMes).toFixed(2)),
  });
}