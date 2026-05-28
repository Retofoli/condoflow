import api from './api';

export interface MesProjetado {
  mes: string;
  entrada: number;
  saida: number;
  saldo: number;
}

export interface ResultadoSimulacao {
  projecao: MesProjetado[];
  podeContratar: boolean;
  primeiroMesNegativo: string | null;
}

export interface LancamentoExtra {
  id: string;
  condominioId: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  mesInicio: string;
  tipo: 'SAIDA' | 'ENTRADA';
  criadoEm: string;
}

export async function getProjecao(
  condominioId: string,
  meses = 12
): Promise<MesProjetado[]> {
  const res = await api.get(
    `/condominios/${condominioId}/projecao?meses=${meses}`
  );
  return res.data;
}

export async function simular(
  condominioId: string,
  valor: number,
  parcelas: number,
  mesInicio: string
): Promise<ResultadoSimulacao> {
  const res = await api.post(`/condominios/${condominioId}/simular`, {
    valor,
    parcelas,
    mesInicio,
  });
  return res.data;
}

export async function getExtras(
  condominioId: string
): Promise<LancamentoExtra[]> {
  const res = await api.get(`/condominios/${condominioId}/extras`);
  return res.data;
}

export async function criarExtra(
  condominioId: string,
  dados: {
    nome: string;
    valorTotal: number;
    parcelas: number;
    mesInicio: string;
    tipo: 'SAIDA' | 'ENTRADA';
  }
): Promise<LancamentoExtra> {
  const res = await api.post(`/condominios/${condominioId}/extras`, dados);
  return res.data;
}

export async function deletarExtra(
  condominioId: string,
  extraId: string
): Promise<void> {
  await api.delete(`/condominios/${condominioId}/extras/${extraId}`);
}