// força redeploy
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listarCondominios,
  editarCondominio,
  atualizarSaldo,
  listarFixas,
  criarFixa,
  removerFixa,
} from '../services/condominios';
import { Condominio as CondominioType, ContaFixa } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Badge } from '../components/Badge';

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getMesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

const CATEGORIAS = ['Energia', 'Água', 'Pessoal', 'Manutenção', 'Seguros', 'Serviços', 'Limpeza', 'Outros'];

export function Condominio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [condo, setCondo] = useState<CondominioType | null>(null);
  const [fixas, setFixas] = useState<ContaFixa[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [formCondo, setFormCondo] = useState({ nome: '', unidades: '', taxaMensal: '', fundoReserva: '', saldo: '' });
  const [salvandoCondo, setSalvandoCondo] = useState(false);

  const [novaFixa, setNovaFixa] = useState({ nome: '', valor: '', diaVencimento: '', categoria: '' });
  const [adicionandoFixa, setAdicionandoFixa] = useState(false);
  const [salvandoFixa, setSalvandoFixa] = useState(false);
  const [erroFixa, setErroFixa] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      listarCondominios().then((lista) => lista.find((c) => c.id === id) ?? null),
      listarFixas(id),
    ])
      .then(([condoData, fixasData]) => {
        if (!condoData) { navigate('/dashboard'); return; }
        setCondo(condoData);
        setFixas(fixasData);
        setFormCondo({
          nome: condoData.nome,
          unidades: String(condoData.unidades),
          taxaMensal: String(condoData.taxaMensal),
          fundoReserva: String(condoData.fundoReserva),
          saldo: String(condoData.saldo),
        });
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setCarregando(false));
  }, [id, navigate]);

  async function handleSalvarCondo(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSalvandoCondo(true);
    try {
      const atualizado = await editarCondominio(id, {
        nome: formCondo.nome,
        unidades: parseInt(formCondo.unidades),
        taxaMensal: parseFloat(formCondo.taxaMensal),
        fundoReserva: parseFloat(formCondo.fundoReserva),
      });
      await atualizarSaldo(id, parseFloat(formCondo.saldo));
      setCondo((prev) => prev ? { ...atualizado, saldo: parseFloat(formCondo.saldo), ultimaEntrada: prev.ultimaEntrada } : null);
      setEditando(false);
    } catch {
      alert('Não foi possível salvar as alterações.');
    } finally {
      setSalvandoCondo(false);
    }
  }

  async function handleAdicionarFixa(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setErroFixa('');
    setSalvandoFixa(true);
    try {
      const criada = await criarFixa(id, {
        nome: novaFixa.nome,
        valor: parseFloat(novaFixa.valor),
        diaVencimento: parseInt(novaFixa.diaVencimento),
        categoria: novaFixa.categoria,
      });
      setFixas((prev) => [...prev, criada]);
      setNovaFixa({ nome: '', valor: '', diaVencimento: '', categoria: '' });
      setAdicionandoFixa(false);
    } catch (err: unknown) {
      setErroFixa(
        (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro ??
          'Erro ao adicionar conta.'
      );
    } finally {
      setSalvandoFixa(false);
    }
  }

  async function handleRemoverFixa(fixaId: string, nome: string) {
    if (!id || !window.confirm(`Remover "${nome}"?`)) return;
    try {
      await removerFixa(id, fixaId);
      setFixas((prev) => prev.filter((f) => f.id !== fixaId));
    } catch {
      alert('Não foi possível remover a conta.');
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando condomínio..." />;
  if (!condo) return null;

  const totalFixas = fixas.filter((f) => f.ativa).reduce((acc, f) => acc + f.valor, 0);
  const mesAtual = getMesAtual();
  const ultimaEntrada = condo.ultimaEntrada;
  const entradaMensal = ultimaEntrada ? ultimaEntrada.valor : condo.taxaMensal;
  const entradaEstimada = !ultimaEntrada;
  const entradaMesAtualLancada = ultimaEntrada?.mes === mesAtual;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{condo.nome}</h1>
      </div>

      {/* Atalhos rápidos */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/condominios/${id}/pagamentos`)}
          className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          💳 Pagamentos do mês
        </button>
        <button
          onClick={() => navigate(`/condominios/${id}/entradas`)}
          className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 text-sm font-medium transition-colors"
        >
          📥 Entradas mensais
        </button>
        <button
          onClick={() => navigate(`/condominios/${id}/projecao`)}
          className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
        >
          📊 Projeção 12 meses
        </button>
        <button
          onClick={() => navigate(`/condominios/${id}/simulador`)}
          className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
        >
          🧮 Simulador
        </button>
      </div>

      {/* Alerta de entrada pendente */}
      {!entradaMesAtualLancada && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠ A entrada de <strong>{labelMes(mesAtual)}</strong> ainda não foi lançada.
          {entradaEstimada
            ? ' Os valores abaixo usam a taxa mensal estimada.'
            : ` Usando entrada de ${labelMes(ultimaEntrada!.mes)} como referência.`}
        </div>
      )}

      {/* Card de dados */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Dados do condomínio</h2>
          <button
            onClick={() => setEditando(!editando)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editando ? (
          <form onSubmit={handleSalvarCondo} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
              <input
                required
                value={formCondo.nome}
                onChange={(e) => setFormCondo({ ...formCondo, nome: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unidades</label>
                <input required type="number" min="1" value={formCondo.unidades}
                  onChange={(e) => setFormCondo({ ...formCondo, unidades: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Saldo (R$)</label>
                <input required type="number" step="0.01" value={formCondo.saldo}
                  onChange={(e) => setFormCondo({ ...formCondo, saldo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Taxa estimada (R$)</label>
                <input required type="number" min="0" step="0.01" value={formCondo.taxaMensal}
                  onChange={(e) => setFormCondo({ ...formCondo, taxaMensal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fundo reserva (R$)</label>
                <input required type="number" min="0" step="0.01" value={formCondo.fundoReserva}
                  onChange={(e) => setFormCondo({ ...formCondo, fundoReserva: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditando(false)}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={salvandoCondo}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {salvandoCondo ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Saldo atual', valor: formatarMoeda(condo.saldo), destaque: true, positivo: condo.saldo >= 0 },
              { label: 'Unidades', valor: String(condo.unidades) },
              { label: 'Taxa estimada', valor: formatarMoeda(condo.taxaMensal) },
              { label: 'Fundo de reserva', valor: formatarMoeda(condo.fundoReserva) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`mt-1 text-lg font-semibold ${item.destaque ? (item.positivo ? 'text-green-700' : 'text-red-700') : 'text-gray-900'}`}>
                  {item.valor}
                </p>
              </div>
            ))}
          </div>
        )}

        {!editando && (
          <div className="mt-4 flex flex-wrap gap-6 border-t pt-4 text-sm">
            <div>
              <span className="text-gray-500">Entrada mensal: </span>
              <span className="font-medium text-green-700">{formatarMoeda(entradaMensal)}</span>
              {entradaEstimada && <span className="ml-1 text-xs text-amber-500">(estimativa)</span>}
              {!entradaEstimada && ultimaEntrada && (
                <span className="ml-1 text-xs text-gray-400">
                  ({labelMes(ultimaEntrada.mes)}{!entradaMesAtualLancada ? ' — mês anterior' : ''})
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Saída fixa: </span>
              <span className="font-medium text-red-700">{formatarMoeda(totalFixas)}</span>
            </div>
            <div>
              <span className="text-gray-500">Resultado: </span>
              <span className={`font-medium ${entradaMensal - totalFixas >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatarMoeda(entradaMensal - totalFixas)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contas fixas */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Contas fixas mensais</h2>
            <p className="text-xs text-gray-500">Total: {formatarMoeda(totalFixas)}/mês</p>
          </div>
          <button
            onClick={() => setAdicionandoFixa(!adicionandoFixa)}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            + Adicionar
          </button>
        </div>

        {adicionandoFixa && (
          <form onSubmit={handleAdicionarFixa} className="mb-4 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-blue-800">Nova conta fixa</h3>
            {erroFixa && <p className="mb-2 text-xs text-red-600">{erroFixa}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Nome *</label>
                <input required value={novaFixa.nome}
                  onChange={(e) => setNovaFixa({ ...novaFixa, nome: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Ex: Energia elétrica" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Valor (R$) *</label>
                <input required type="number" min="0.01" step="0.01" value={novaFixa.valor}
                  onChange={(e) => setNovaFixa({ ...novaFixa, valor: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="0,00" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Vencimento (dia) *</label>
                <input required type="number" min="1" max="31" value={novaFixa.diaVencimento}
                  onChange={(e) => setNovaFixa({ ...novaFixa, diaVencimento: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="10" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Categoria *</label>
                <select required value={novaFixa.categoria}
                  onChange={(e) => setNovaFixa({ ...novaFixa, categoria: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="">Selecionar...</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => { setAdicionandoFixa(false); setErroFixa(''); }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={salvandoFixa}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {salvandoFixa ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        )}

        {fixas.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nenhuma conta fixa cadastrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {fixas.map((fixa) => (
              <div key={fixa.id} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{fixa.nome}</span>
                    <Badge texto={fixa.categoria} cor="azul" />
                  </div>
                  <p className="text-xs text-gray-500">Vence todo dia {fixa.diaVencimento}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{formatarMoeda(fixa.valor)}</span>
                  <button onClick={() => handleRemoverFixa(fixa.id, fixa.nome)}
                    className="text-xs text-red-500 hover:text-red-700">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
