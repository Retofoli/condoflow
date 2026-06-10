import api from './api';

export interface SindicoInfo {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export interface CondominioComSindico {
  id: string;
  nome: string;
  sindico: SindicoInfo | null;
}

export async function getSindicos(): Promise<CondominioComSindico[]> {
  const res = await api.get('/sindicos');
  return res.data;
}

export async function criarSindico(dados: {
  nome: string;
  email: string;
  senha: string;
  condominioId: string;
}): Promise<void> {
  await api.post('/sindicos', dados);
}

export async function removerSindico(sindicoId: string): Promise<void> {
  await api.delete(`/sindicos/${sindicoId}`);
}