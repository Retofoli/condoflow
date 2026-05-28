import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { simular, ResultadoSimulacao } from '../services/projecao';

const MESES: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr',
  '05':'Mai','06':'Jun','07':'Jul','08':'Ago',
  '09':'Set','10':'Out','11':'Nov','12':'Dez'
};

function labelMes(key: string) {
  const [, m] = key.split('-');
  return MESES[m] ?? m;
}

function formatReal(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });
}

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Simulador() {
  const { id } = useParams<{ id: string }>();
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [mesInicio, setMesInicio] = useState(getMesAtual());
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function calcular() {
    if (!id || !valor || Number(valor) <= 0) return;
    setCarregando(true);
    try {
      const res = await simular(
        id,
        Number(valor),
        Number(parcelas),
        mesInicio
      );
      setResultado(res);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">
        Simulador "E se?"
      </h1>
      <p className="text-gray-500 mb-6">
        Teste o impacto de um novo gasto antes de contratar.
      </p>

      {/* Formulário */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Valor total (R$)
            </label>
            <input
              type="number"
              value={valor}
              onChange={e => { setValor(e.target.value); setResultado(null); }}
              placeholder="Ex: 12000"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Número de parcelas
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={parcelas}
              onChange={e => { setParcelas(e.target.value); setResultado(null); }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Mês de início
            </label>
            <input
              type="month"
              value={mesInicio}
              onChange={e => { setMesInicio(e.target.value); setResultado(null); }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calcular}
              disabled={carregando || !valor}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
                         text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              {carregando ? 'Calculando...' : 'Simular impacto'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <>
          <div className={`rounded-xl p-5 mb-6 border ${
            resultado.podeContratar
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-xl font-bold mb-1 ${
              resultado.podeContratar ? 'text-green-800' : 'text-red-800'
            }`}>
              {resultado.podeContratar
                ? '✅ Pode contratar!'
                : '🔴 Risco: saldo negativo'}
            </p>
            <p className={`text-sm ${
              resultado.podeContratar ? 'text-green-700' : 'text-red-700'
            }`}>
              {resultado.podeContratar
                ? 'Nenhum mês ficará no vermelho com esse gasto.'
                : `Saldo negativo a partir de ${
                    labelMes(resultado.primeiroMesNegativo!)
                  }/${resultado.primeiroMesNegativo!.slice(2,4)}.`}
            </p>
          </div>

          {/* Gráfico do impacto */}
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500 mb-3">
              Impacto nos próximos 12 meses
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={resultado.projecao}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="mes"
                  tickFormatter={labelMes}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v: number) => formatReal(v)}
                  labelFormatter={labelMes}
                />
                <Bar dataKey="saldo" radius={[4, 4, 0, 0]}>
                  {resultado.projecao.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.saldo >= 0 ? '#1D9E75' : '#E24B4A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}