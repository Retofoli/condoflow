import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getEntradas,
  lancarEntrada,
  deletarEntrada,
  EntradaMensal,
} from '../services/entradas';

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatReal(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function labelMes(key: string) {
  const meses: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };
  const [y, m] = key.split('-');
  return `${meses[m]}/${y.slice(2)}`;
}

// Gera os últimos N meses a partir do atual
function getUltimosMeses(n: number): string[] {
  const meses: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    meses.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return meses;
}

export default function Entradas() {
  const { id } = useParams<{ id: string }>();
  const [entradas, setEntradas] = useState<EntradaMensal[]>([]);
  const [mes, setMes] = useState(getMesAtual());
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function carregar() {
    if (!id) return;
    const data = await getEntradas(id);
    setEntradas(data);
  }

  useEffect(() => { carregar(); }, [id]);

  async function handleSalvar() {
    if (!id || !valor || Number(valor) <= 0) return;
    setSalvando(true);
    setMensagem(null);
    try {
      await lancarEntrada(id, mes, Number(valor), observacao);
      setValor('');
      setObservacao('');
      setMensagem({ tipo: 'sucesso', texto: entradaMesAtual ? 'Valor atualizado com sucesso!' : 'Entrada lançada com sucesso!' });
      await carregar();
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao lançar entrada.' });
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar(entradaId: string) {
    if (!id) return;
    if (!confirm('Remover esta entrada? O saldo será ajustado.')) return;
    await deletarEntrada(id, entradaId);
    await carregar();
  }

  // Preenche o formulário com o valor existente ao trocar o mês
  function handleMesChange(novoMes: string) {
    setMes(novoMes);
    const existente = entradas.find(e => e.mes === novoMes);
    if (existente) {
      setValor(String(existente.valor));
      setObservacao(existente.observacao || '');
    } else {
      setValor('');
      setObservacao('');
    }
    setMensagem(null);
  }

  const entradaMesAtual = entradas.find(e => e.mes === mes);
  const ultimosMeses = getUltimosMeses(6);
  const mesesSemEntrada = ultimosMeses.filter(m => !entradas.find(e => e.mes === m));
  const totalRecebido = entradas.reduce((acc, e) => acc + e.valor, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Entradas mensais
        </h1>
        <p className="text-gray-500 text-sm">
          Registre o valor total recebido no mês — taxas, atrasos e acordos.
        </p>
      </div>

      {/* Alerta de meses pendentes */}
      {mesesSemEntrada.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800 mb-1">
              {mesesSemEntrada.length === 1
                ? '1 mês sem entrada lançada'
                : `${mesesSemEntrada.length} meses sem entrada lançada`}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {mesesSemEntrada.map(m => (
                <button
                  key={m}
                  onClick={() => handleMesChange(m)}
                  className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 
                             rounded-md px-2 py-1 transition-colors"
                >
                  {labelMes(m)} →
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Total registrado</p>
          <p className="text-xl font-semibold text-gray-900">{formatReal(totalRecebido)}</p>
          <p className="text-xs text-gray-400 mt-1">{entradas.length} meses lançados</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Mês atual</p>
          {entradas.find(e => e.mes === getMesAtual()) ? (
            <>
              <p className="text-xl font-semibold text-emerald-600">
                {formatReal(entradas.find(e => e.mes === getMesAtual())!.valor)}
              </p>
              <p className="text-xs text-emerald-500 mt-1">✓ lançado</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-300">—</p>
              <p className="text-xs text-amber-500 mt-1">pendente</p>
            </>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          {entradaMesAtual ? `Atualizar entrada — ${labelMes(mes)}` : 'Lançar entrada'}
        </h2>

        {entradaMesAtual && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-700">
            Valor atual em {labelMes(mes)}: <strong>{formatReal(entradaMesAtual.valor)}</strong>.
            Salvar vai substituir pelo novo valor e ajustar o saldo automaticamente.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mês de referência
            </label>
            <input
              type="month"
              value={mes}
              onChange={e => handleMesChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valor total recebido (R$)
            </label>
            <input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Ex: 14200"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observação <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: 2 unidades em atraso, 1 acordo recebido"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSalvar}
            disabled={salvando || !valor || Number(valor) <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            {salvando ? 'Salvando...' : entradaMesAtual ? 'Atualizar valor' : 'Lançar entrada'}
          </button>

          {mensagem && (
            <span className={`text-sm ${mensagem.tipo === 'sucesso' ? 'text-emerald-600' : 'text-red-500'}`}>
              {mensagem.tipo === 'sucesso' ? '✓' : '✗'} {mensagem.texto}
            </span>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Histórico de entradas</h2>
          <span className="text-xs text-gray-400">{entradas.length} registros</span>
        </div>

        {entradas.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Nenhuma entrada lançada ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Mês</th>
                <th className="text-right px-5 py-3">Valor recebido</th>
                <th className="text-left px-5 py-3">Observação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entradas.map(e => (
                <tr
                  key={e.id}
                  className={`hover:bg-gray-50 transition-colors ${e.mes === getMesAtual() ? 'bg-emerald-50/40' : ''}`}
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{labelMes(e.mes)}</span>
                    {e.mes === getMesAtual() && (
                      <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                        atual
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-semibold text-emerald-700">{formatReal(e.valor)}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {e.observacao || '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleMesChange(e.mes)}
                      className="text-blue-400 hover:text-blue-600 text-xs mr-3 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(e.id)}
                      className="text-red-300 hover:text-red-500 text-xs transition-colors"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
