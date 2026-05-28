export type Perfil = 'ADMIN' | 'SINDICO';
export type TipoLancamento = 'SAIDA' | 'ENTRADA';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  perfil: Perfil;
  criadoEm?: string;
}

export interface ContaFixa {
  id: string;
  condominioId: string;
  nome: string;
  valor: number;
  diaVencimento: number;
  categoria: string;
  ativa: boolean;
}

export interface LancamentoExtra {
  id: string;
  condominioId: string;
  nome: string;
  valorTotal: number;
  parcelas: number;
  mesInicio: string;
  tipo: TipoLancamento;
  criadoEm: string;
}

export interface Condominio {
  id: string;
  nome: string;
  saldo: number;
  unidades: number;
  taxaMensal: number;
  fundoReserva: number;
  adminId: string;
  sindicoId?: string;
  contasFixas: ContaFixa[];
  extras: LancamentoExtra[];
  criadoEm: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface ApiError {
  erro: string;
}
