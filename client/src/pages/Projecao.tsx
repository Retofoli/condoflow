import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { getProjecao, MesProjetado } from '../services/projecao';

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

export default function Projecao() {
  const { id } = useParams<{ id: string }>();
  const [dados, setDados] = useState<MesProjetado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProjecao(id).then(d => {
      setDados(d);
      setCarregando(false);
    });
  }, [id]);

  if (carregando) return (
    <div className="p-8 text-gray-500">Calculando projeção...</div>
  );

  const negativos = dados.filter(m => m.saldo < 0).length;
  const status = negativos === 0 ? 'saudavel'
    : negativos <= 3 ? 'atencao' : 'critico';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Projeção 12 meses
      </h1>

      {/* Card de status */}
      <div className={`rounded-xl p-4 mb-6 border ${
        status === 'saudavel'
          ? 'bg-green-50 border-green-200 text-green-800'
          : status === 'atencao'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <p className="text-lg font-semibold">
          {status === 'saudavel' && '✅ Situação saudável'}
          {status === 'atencao' && '⚠️ Atenção necessária'}
          {status === 'critico' && '🔴 Situação crítica'}
        </p>
        <p className="text-sm mt-1">
          {negativos === 0
            ? 'Nenhum mês com saldo negativo nos próximos 12 meses.'
            : `${negativos} mês${negativos > 1 ? 'es' : ''} com saldo negativo projetado.`}
        </p>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
              {dados.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.saldo >= 0 ? '#1D9E75' : '#E24B4A'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Mês</th>
              <th className="text-right px-4 py-3">Entradas</th>
              <th className="text-right px-4 py-3">Saídas</th>
              <th className="text-right px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((m, i) => (
              <tr key={i} className={`border-t ${
                m.saldo < 0 ? 'bg-red-50' : ''
              }`}>
                <td className="px-4 py-3 font-medium">
                  {labelMes(m.mes)}/{m.mes.slice(2, 4)}
                </td>
                <td className="px-4 py-3 text-right text-green-700">
                  {formatReal(m.entrada)}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {formatReal(m.saida)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  m.saldo >= 0 ? 'text-green-700' : 'text-red-600'
                }`}>
                  {formatReal(m.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}