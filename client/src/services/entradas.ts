import api from './api';

export interface EntradaMensal {
  id: string;
  condominioId: string;
  mes: string;
  valor: number;
  observacao?: string;
  criadoEm: string;
}

export interface CondomiниoPendente {
  id: string;
  nome: string;
  diaArrecadacao: number;
  mesAtual: string;
}

export async function getEntradas(
  condominioId: string
): Promise<EntradaMensal[]> {
  const res = await api.get(`/condominios/${condominioId}/entradas`);
  return res.data;
}

export async function lancarEntrada(
  condominioId: string,
  mes: string,
  valor: number,
  observacao?: string
): Promise<EntradaMensal> {
  const res = await api.post(`/condominios/${condominioId}/entradas`, {
    mes,
    valor,
    observacao,
  });
  return res.data;
}

export async function deletarEntrada(
  condominioId: string,
  entradaId: string
): Promise<void> {
  await api.delete(`/condominios/${condominioId}/entradas/${entradaId}`);
}

export async function getCondominiosPendentes(): Promise<CondomiниoPendente[]> {
  const res = await api.get('/condominios/pendentes/mes');
  return res.data;
}