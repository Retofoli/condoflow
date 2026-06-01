import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listarPagamentos,
  marcarComoPago,
  estornarPagamento,
  PagamentoFixo,
} from '../services/pagamentos';

function getMesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function labelMes(key: string) {
  const meses: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  const [y, m] = key.split('-');
  return `${meses[m]} de ${y}`;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Gera lista de meses para o seletor (6 meses atrás até 6 meses à frente)
function getMesesOpcoes(): string[] {
  const meses: string[] = [];
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  for (let i = 0; i < 12; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    meses.push(`${y}-${m}`);
    d.setMonth(d.getMonth() + 1);
  }
  return meses;
}

export default function Pagamentos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mes, setMes] = useState(getMesAtual());
  const [pagamentos, setPagamentos] = useState<PagamentoFixo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal de pagamento
  const [modalPagamento, setModalPagamento] = useState<PagamentoFixo | null>(null);
  const [valorPago, setValorPago] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function carregar() {
    if (!id) return;
    setCarregando(true);
    try {
      const data = await listarPagamentos(id, mes);
      setPagamentos(data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [id, mes]);

  async function handlePagar() {
    if (!id || !modalPagamento || !valorPago || Number(valorPago) <= 0) return;
    setSalvando(true);
    try {
      const atualizado = await marcarComoPago(id, modalPagamento.id, Number(valorPago), observacao);
      setPagamentos((prev) => prev.map((p) => p.id === atualizado.id ? atualizado : p));
      setModalPagamento(null);
      setValorPago('');
      setObservacao('');
      setMensagem({ tipo: 'sucesso', texto: 'Pagamento registrado com sucesso!' });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao registrar pagamento.' });
    } finally {
      setSalvando(false);
    }
  }

  async function handleEstornar(pagamento: PagamentoFixo) {
    if (!id) return;
    if (!window.confirm(`Estornar pagamento de "${pagamento.contaFixa.nome}"? O valor será devolvido ao saldo.`)) return;
    try {
      const revertido = await estornarPagamento(id, pagamento.id);
      setPagamentos((prev) => prev.map((p) => p.id === revertido.id ? revertido : p));
      setMensagem({ tipo: 'sucesso', texto: 'Pagamento estornado.' });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao estornar pagamento.' });
    }
  }

  function abrirModalPagamento(pagamento: PagamentoFixo) {
    setModalPagamento(pagamento);
    setValorPago(String(pagamento.valorPrevisto));
    setObservacao('');
    setMensagem(null);
  }

  const pendentes = pagamentos.filter((p) => p.valorPago === null);
  const pagos = pagamentos.filter((p) => p.valorPago !== null);
  const totalPrevisto = pagamentos.reduce((acc, p) => acc + p.valorPrevisto, 0);
  const totalPago = pagos.reduce((acc, p) => acc + (p.valorPago ?? 0), 0);
  const totalPendente = pendentes.reduce((acc, p) => acc + p.valorPrevisto, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(`/condominios/${id}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Pagamentos</h1>
      </div>

      {/* Seletor de mês */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Mês:</label>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getMesesOpcoes().map((m) => (
            <option key={m} value={m}>{labelMes(m)}</option>
          ))}
        </select>
      </div>

      {/* Mensagem de feedback */}
      {mensagem && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${
          mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {mensagem.tipo === 'sucesso' ? '✓' : '✗'} {mensagem.texto}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Total previsto</p>
          <p className="text-lg font-semibold text-gray-900">{formatarMoeda(totalPrevisto)}</p>
          <p className="text-xs text-gray-400 mt-1">{pagamentos.length} contas</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Já pago</p>
          <p className="text-lg font-semibold text-green-600">{formatarMoeda(totalPago)}</p>
          <p className="text-xs text-gray-400 mt-1">{pagos.length} contas</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Pendente</p>
          <p className="text-lg font-semibold text-amber-600">{formatarMoeda(totalPendente)}</p>
          <p className="text-xs text-gray-400 mt-1">{pendentes.length} contas</p>
        </div>
      </div>

      {carregando ? (
        <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>
      ) : pagamentos.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400 text-sm">
          Nenhuma conta fixa cadastrada para este mês.
        </div>
      ) : (
        <>
          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden mb-4">
              <div className="px-5 py-3 border-b bg-amber-50">
                <h2 className="text-sm font-medium text-amber-800">
                  ⏳ Pendentes ({pendentes.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {pendentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.contaFixa.nome}</p>
                      <p className="text-xs text-gray-400">
                        Vence dia {p.contaFixa.diaVencimento} · {p.contaFixa.categoria}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatarMoeda(p.valorPrevisto)}
                      </span>
                      <button
                        onClick={() => abrirModalPagamento(p)}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 font-medium transition-colors"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagos */}
          {pagos.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b bg-green-50">
                <h2 className="text-sm font-medium text-green-800">
                  ✓ Pagos ({pagos.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {pagos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.contaFixa.nome}</p>
                      <p className="text-xs text-gray-400">
                        Pago em {formatarData(p.dataPagamento!)}
                        {p.observacao && ` · ${p.observacao}`}
                      </p>
                      {p.valorPago !== p.valorPrevisto && (
                        <p className="text-xs text-amber-600">
                          Previsto: {formatarMoeda(p.valorPrevisto)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-700">
                        {formatarMoeda(p.valorPago!)}
                      </span>
                      <button
                        onClick={() => handleEstornar(p)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Estornar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de pagamento */}
      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Registrar pagamento
            </h2>
            <p className="text-sm text-gray-500 mb-4">{modalPagamento.contaFixa.nome}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Valor pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {Number(valorPago) !== modalPagamento.valorPrevisto && Number(valorPago) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Valor previsto: {formatarMoeda(modalPagamento.valorPrevisto)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observação <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: pago com desconto"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalPagamento(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                disabled={salvando || !valorPago || Number(valorPago) <= 0}
                className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-2 text-sm font-medium transition-colors"
              >
                {salvando ? 'Salvando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
