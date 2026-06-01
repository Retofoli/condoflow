import api from './api';

export interface PagamentoFixo {
  id: string;
  condominioId: string;
  contaFixaId: string;
  mes: string;
  valorPrevisto: number;
  valorPago: number | null;
  dataPagamento: string | null;
  observacao: string | null;
  contaFixa: {
    id: string;
    nome: string;
    categoria: string;
    diaVencimento: number;
  };
}

export async function listarPagamentos(condoId: string, mes: string): Promise<PagamentoFixo[]> {
  const { data } = await api.get(`/condominios/${condoId}/pagamentos`, { params: { mes } });
  return data;
}

export async function marcarComoPago(
  condoId: string,
  pagamentoId: string,
  valorPago: number,
  observacao?: string
): Promise<PagamentoFixo> {
  const { data } = await api.post(`/condominios/${condoId}/pagamentos/${pagamentoId}/pagar`, {
    valorPago,
    observacao,
  });
  return data;
}

export async function estornarPagamento(
  condoId: string,
  pagamentoId: string
): Promise<PagamentoFixo> {
  const { data } = await api.delete(`/condominios/${condoId}/pagamentos/${pagamentoId}/pagar`);
  return data;
}