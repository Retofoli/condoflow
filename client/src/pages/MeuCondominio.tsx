import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  getResumo,
  getProjecao,
  getMargem,
  simular,
  Resumo,
  MesProjetado,
  MargemLivre,
  ResultadoSimulacao,
} from '../services/meuCondominio';

function formatReal(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function labelMes(key: string) {
  const meses: Record<string, string> = {
    '01': 'janeiro', '02': 'fevereiro', '03': 'março', '04': 'abril',
    '05': 'maio', '06': 'junho', '07': 'julho', '08': 'agosto',
    '09': 'setembro', '10': 'outubro', '11': 'novembro', '12': 'dezembro',
  };
  const [y, m] = key.split('-');
  return `${meses[m]} de ${y}`;
}

function labelMesAbrev(key: string) {
  const meses: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };
  const [, m] = key.split('-');
  return meses[m] ?? m;
}

export default function MeuCondominio() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [projecao, setProjecao] = useState<MesProjetado[]>([]);
  const [margem, setMargem] = useState<MargemLivre | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [valorSimulado, setValorSimulado] = useState('');
  const [parcelasSimuladas, setParcelasSimuladas] = useState('1');
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const [r, p, m] = await Promise.all([getResumo(), getProjecao(), getMargem()]);
        setResumo(r);
        setProjecao(p);
        setMargem(m);
      } catch {
        setErro('Não foi possível carregar os dados. Tente novamente em instantes.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function executarSimulacao() {
    if (!valorSimulado || Number(valorSimulado) <= 0) return;
    setSimulando(true);
    setResultadoSimulacao(null);
    try {
      const d = new Date();
      const mesAtual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const res = await simular(Number(valorSimulado), Number(parcelasSimuladas), mesAtual);
      setResultadoSimulacao(res);
    } finally {
      setSimulando(false);
    }
  }

  if (carregando) {
    return <div className="p-8 text-center text-gray-400">Carregando seu condomínio...</div>;
  }

  if (erro || !resumo || !margem) {
    return <div className="p-8 text-center text-red-500">{erro}</div>;
  }

  // ── Semáforo financeiro ──────────────────────────────────────
  const mesesNegativos = projecao.filter(m => m.saldo < 0);
  const primeiroNegativo = mesesNegativos[0]?.mes ?? null;
  const indicePrimeiroNegativo = primeiroNegativo
    ? projecao.findIndex(m => m.mes === primeiroNegativo)
    : -1;

  let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
  if (primeiroNegativo) {
    status = indicePrimeiroNegativo <= 2 ? 'vermelho' : 'amarelo';
  }

  const semaforo = {
    verde: {
      cor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      bolinha: 'bg-emerald-500',
      titulo: 'Finanças saudáveis',
      frase: 'O caixa cobre as contas dos próximos 12 meses. Bom momento para planejar.',
    },
    amarelo: {
      cor: 'bg-amber-50 border-amber-200 text-amber-800',
      bolinha: 'bg-amber-500',
      titulo: 'Atenção mais adiante',
      frase: `O caixa fica apertado a partir de ${primeiroNegativo ? labelMes(primeiroNegativo) : ''}. Vale planejar com cuidado.`,
    },
    vermelho: {
      cor: 'bg-red-50 border-red-200 text-red-800',
      bolinha: 'bg-red-500',
      titulo: 'Situação exige cuidado',
      frase: 'As contas estão maiores que a arrecadação. Converse com a administradora sobre os próximos passos.',
    },
  }[status];

  const margemAtual = margem.margemMesAtual;

  return (
    <div className="px-4 py-6 max-w-md mx-auto sm:max-w-2xl">
      {/* Cabeçalho */}
      <p className="text-sm text-gray-500">Seu condomínio</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{resumo.condominio.nome}</h1>

      {/* Semáforo */}
      <div className={`rounded-2xl border p-4 mb-4 flex items-start gap-3 ${semaforo.cor}`}>
        <span className={`mt-1 h-3 w-3 rounded-full shrink-0 ${semaforo.bolinha}`} />
        <div>
          <p className="font-semibold">{semaforo.titulo}</p>
          <p className="text-sm mt-0.5 opacity-90">{semaforo.frase}</p>
        </div>
      </div>

      {/* Quanto posso gastar */}
      <div className="rounded-2xl bg-white border p-5 mb-4 shadow-sm">
        <p className="text-sm text-gray-500">Disponível para novos gastos</p>
        {margemAtual > 0 ? (
          <>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              até {formatReal(margemAtual)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Gastando até esse valor, nenhum mês do próximo ano fica no vermelho.
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-400 mt-1">R$ 0,00</p>
            <p className="text-sm text-gray-500 mt-2">
              Este não é um bom momento para gastos extras
              {primeiroNegativo && ` — a projeção indica caixa negativo em ${labelMes(primeiroNegativo)}`}.
            </p>
          </>
        )}
      </div>

      {/* Simulador interativo */}
      <div className="rounded-2xl bg-white border p-5 mb-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-1">Simular novo gasto</p>
        <p className="text-xs text-gray-400 mb-4">
          Digite o valor que quer gastar e veja se o caixa aguenta.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Valor total (R$)</label>
              <input
                type="number"
                min="1"
                value={valorSimulado}
                onChange={e => { setValorSimulado(e.target.value); setResultadoSimulacao(null); }}
                placeholder="Ex: 5000"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">Parcelas</label>
              <select
                value={parcelasSimuladas}
                onChange={e => { setParcelasSimuladas(e.target.value); setResultadoSimulacao(null); }}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={executarSimulacao}
            disabled={simulando || !valorSimulado || Number(valorSimulado) <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            {simulando ? 'Calculando...' : 'Simular'}
          </button>
        </div>

        {resultadoSimulacao && (
          <div className={`mt-4 rounded-xl border p-4 ${
            resultadoSimulacao.podeContratar
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`font-semibold text-sm ${
              resultadoSimulacao.podeContratar ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {resultadoSimulacao.podeContratar ? 'Pode contratar!' : 'Risco de caixa negativo'}
            </p>
            <p className={`text-xs mt-1 ${
              resultadoSimulacao.podeContratar ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {resultadoSimulacao.podeContratar
                ? 'Com esse gasto, nenhum mês dos próximos 12 fica no vermelho.'
                : `O caixa ficaria negativo a partir de ${
                    labelMes(resultadoSimulacao.primeiroMesNegativo!)
                  }. Revise o valor ou as parcelas.`}
            </p>
          </div>
        )}
      </div>

      {/* Saldo e mês atual */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-white border p-4 shadow-sm">
          <p className="text-xs text-gray-500">Saldo em caixa</p>
          <p className={`text-lg font-bold mt-1 ${resumo.condominio.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatReal(resumo.condominio.saldo)}
          </p>
        </div>
        <div className="rounded-2xl bg-white border p-4 shadow-sm">
          <p className="text-xs text-gray-500">Resultado deste mês</p>
          <p className={`text-lg font-bold mt-1 ${resumo.resultadoMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatReal(resumo.resultadoMes)}
          </p>
        </div>
        <div className="rounded-2xl bg-white border p-4 shadow-sm">
          <p className="text-xs text-gray-500">Entrou no mês</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{formatReal(resumo.entradaMes)}</p>
        </div>
        <div className="rounded-2xl bg-white border p-4 shadow-sm">
          <p className="text-xs text-gray-500">Sai no mês (previsto)</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatReal(resumo.saidaPrevistaMes)}</p>
        </div>
      </div>

      {/* Gráfico: Entra x Sai - próximos 6 meses */}
      <div className="rounded-2xl bg-white border shadow-sm p-4 mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Entradas x Saídas — próximos 6 meses</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projecao.slice(0, 6)} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="mes"
              tickFormatter={labelMesAbrev}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              formatter={(v: number) => formatReal(v)}
              labelFormatter={labelMes}
            />
            <Bar dataKey="entrada" name="Entrada" fill="#86efac" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saida" name="Saída" fill="#fca5a5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: evolução do saldo - 12 meses */}
      <div className="rounded-2xl bg-white border shadow-sm p-4 mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Evolução do saldo — 12 meses</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={projecao.map(m => ({
              ...m,
              saldoPositivo: Math.max(m.saldo, 0),
              saldoNegativo: Math.min(m.saldo, 0),
            }))}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="mes"
              tickFormatter={labelMesAbrev}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              formatter={(_v: number, _name: string, item: { payload?: MesProjetado }) =>
                [formatReal(item.payload?.saldo ?? 0), 'Saldo']
              }
              labelFormatter={labelMes}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="saldoPositivo"
              name="Saldo"
              stroke="#34d399"
              fill="#86efac"
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="saldoNegativo"
              name="Saldo"
              stroke="#f87171"
              fill="#fca5a5"
              fillOpacity={0.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Próximos meses (mini-lista) */}
      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <p className="text-sm font-medium text-gray-600">Próximos meses</p>
        </div>
        <ul>
          {projecao.slice(0, 6).map(m => (
            <li key={m.mes} className="px-5 py-3 border-t first:border-t-0 flex items-center justify-between text-sm">
              <span className="text-gray-600 capitalize">{labelMes(m.mes)}</span>
              <span className={`font-semibold ${m.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatReal(m.saldo)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}