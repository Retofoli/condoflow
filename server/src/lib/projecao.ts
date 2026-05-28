// Helpers de data
export function getMonthKey(offsetFromNow: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetFromNow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

// Tipos
export interface ContaFixa {
  valor: number;
  ativa: boolean;
}

export interface LancamentoExtra {
  valorTotal: number;
  parcelas: number;
  mesInicio: string;
  tipo: 'SAIDA' | 'ENTRADA';
}

export interface EntradaMensal {
  mes: string;
  valor: number;
}

export interface CondoDados {
  saldo: number;
  unidades: number;
  taxaMensal: number;
  fundoReserva: number;
  contasFixas: ContaFixa[];
  extras: LancamentoExtra[];
  entradasMensais: EntradaMensal[];
}

export interface SimularGasto {
  valor: number;
  parcelas: number;
  mesInicio: string;
}

export interface MesProjetado {
  mes: string;
  entrada: number;
  saida: number;
  saldo: number;
}

export interface ResultadoSimulacao {
  projecao: MesProjetado[];
  podeContratar: boolean;
  primeiroMesNegativo: string | null;
}

// Calcula média das últimas 3 entradas reais
function mediaEntradasReais(entradas: EntradaMensal[]): number {
  if (entradas.length === 0) return 0;
  const ultimas = [...entradas]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .slice(0, 3);
  const soma = ultimas.reduce((acc, e) => acc + e.valor, 0);
  return soma / ultimas.length;
}

// Função principal de projeção
export function calcularProjecao(
  condo: CondoDados,
  meses = 12,
  simular?: SimularGasto
): MesProjetado[] {
  let saldo = condo.saldo;

  // Usa média real se houver entradas, senão usa valor teórico
  const entradaEstimada = condo.entradasMensais.length > 0
    ? mediaEntradasReais(condo.entradasMensais)
    : condo.taxaMensal;

  const saidaFixaMensal = condo.contasFixas
    .filter(f => f.ativa)
    .reduce((acc, f) => acc + f.valor, 0);

  const mesAtual = getMonthKey(0);

  return Array.from({ length: meses }, (_, i) => {
    const mes = getMonthKey(i);

    // Se o mês já tem entrada real lançada, usa ela
    const entradaReal = condo.entradasMensais.find(e => e.mes === mes);
    let entrada = entradaReal ? entradaReal.valor : entradaEstimada;
    let saida = saidaFixaMensal;

    // Lançamentos extras parcelados
    condo.extras.forEach(e => {
      const diff = monthDiff(e.mesInicio, mes);
      if (diff >= 0 && diff < e.parcelas) {
        const parcela = e.valorTotal / e.parcelas;
        if (e.tipo === 'ENTRADA') entrada += parcela;
        else saida += parcela;
      }
    });

    // Gasto simulado (opcional)
    if (simular) {
      const diff = monthDiff(simular.mesInicio, mes);
      if (diff >= 0 && diff < simular.parcelas) {
        saida += simular.valor / simular.parcelas;
      }
    }

    saldo = saldo + entrada - saida;

    return {
      mes,
      entrada: Number(entrada.toFixed(2)),
      saida: Number(saida.toFixed(2)),
      saldo: Number(saldo.toFixed(2)),
    };
  });
}

// Função de simulação com resultado de decisão
export function simularGasto(
  condo: CondoDados,
  simular: SimularGasto
): ResultadoSimulacao {
  const projecao = calcularProjecao(condo, 12, simular);
  const mesesNegativos = projecao.filter(m => m.saldo < 0);

  return {
    projecao,
    podeContratar: mesesNegativos.length === 0,
    primeiroMesNegativo: mesesNegativos.length > 0
      ? mesesNegativos[0].mes
      : null,
  };
}