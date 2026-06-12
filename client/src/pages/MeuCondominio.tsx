import { useEffect, useState } from 'react';
import {
  getResumo,
  getProjecao,
  getMargem,
  Resumo,
  MesProjetado,
  MargemLivre,
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

export default function MeuCondominio() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [projecao, setProjecao] = useState<MesProjetado[]>([]);
  const [margem, setMargem] = useState<MargemLivre | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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

      {/* Próximos meses (mini-lista, o gráfico vem na Etapa 5) */}
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