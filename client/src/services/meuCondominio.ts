import api from './api';

export interface Resumo {
  condominio: { id: string; nome: string; saldo: number; fundoReserva: number };
  mes: string;
  entradaMes: number;
  saidaPrevistaMes: number;
  saidaPagaMes: number;
  resultadoMes: number;
}

export interface MesProjetado {
  mes: string;
  entrada: number;
  saida: number;
  saldo: number;
}

export interface MargemLivre {
  margemMesAtual: number;
  porMes: { mes: string; margem: number }[];
}

export interface ResultadoSimulacao {
  projecao: MesProjetado[];
  podeContratar: boolean;
  primeiroMesNegativo: string | null;
}

export async function getResumo(): Promise<Resumo> {
  const res = await api.get('/meu-condominio');
  return res.data;
}

export async function getProjecao(): Promise<MesProjetado[]> {
  const res = await api.get('/meu-condominio/projecao');
  return res.data;
}

export async function getMargem(): Promise<MargemLivre> {
  const res = await api.get('/meu-condominio/margem');
  return res.data;
}

export async function simular(
  valor: number,
  parcelas: number,
  mesInicio: string
): Promise<ResultadoSimulacao> {
  const res = await api.post('/meu-condominio/simular', { valor, parcelas, mesInicio });
  return res.data;
}