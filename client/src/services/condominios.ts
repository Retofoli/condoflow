import api from './api';
import { Condominio, ContaFixa } from '../types';

export async function listarCondominios(): Promise<Condominio[]> {
  const { data } = await api.get<Condominio[]>('/condominios');
  return data;
}

export async function criarCondominio(dados: {
  nome: string;
  saldo: number;
  unidades: number;
  taxaMensal: number;
  fundoReserva: number;
}): Promise<Condominio> {
  const { data } = await api.post<Condominio>('/condominios', dados);
  return data;
}

export async function editarCondominio(
  id: string,
  dados: Partial<{ nome: string; unidades: number; taxaMensal: number; fundoReserva: number }>
): Promise<Condominio> {
  const { data } = await api.put<Condominio>(`/condominios/${id}`, dados);
  return data;
}

export async function removerCondominio(id: string): Promise<void> {
  await api.delete(`/condominios/${id}`);
}

export async function atualizarSaldo(id: string, saldo: number): Promise<Condominio> {
  const { data } = await api.patch<Condominio>(`/condominios/${id}/saldo`, { saldo });
  return data;
}

export async function listarFixas(condoId: string): Promise<ContaFixa[]> {
  const { data } = await api.get<ContaFixa[]>(`/condominios/${condoId}/fixas`);
  return data;
}

export async function criarFixa(
  condoId: string,
  dados: { nome: string; valor: number; diaVencimento: number; categoria: string }
): Promise<ContaFixa> {
  const { data } = await api.post<ContaFixa>(`/condominios/${condoId}/fixas`, dados);
  return data;
}

export async function removerFixa(condoId: string, fixaId: string): Promise<void> {
  await api.delete(`/condominios/${condoId}/fixas/${fixaId}`);
}
