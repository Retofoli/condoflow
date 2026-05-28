import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '../hooks/useCondominios';
import { criarCondominio, removerCondominio } from '../services/condominios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Condominio } from '../types';

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface NovoCondoForm {
  nome: string;
  saldo: string;
  unidades: string;
  taxaMensal: string;
  fundoReserva: string;
}

const formVazio: NovoCondoForm = { nome: '', saldo: '0', unidades: '', taxaMensal: '', fundoReserva: '' };

export function Dashboard() {
  const { condominios, carregando, erro, recarregar, setCondominios } = useCondominios();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<NovoCondoForm>(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const navigate = useNavigate();

  function totalSaidas(condo: Condominio) {
    return condo.contasFixas.filter((f) => f.ativa).reduce((acc, f) => acc + f.valor, 0);
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErroForm('');
    setSalvando(true);
    try {
      const novo = await criarCondominio({
        nome: form.nome,
        saldo: parseFloat(form.saldo) || 0,
        unidades: parseInt(form.unidades),
        taxaMensal: parseFloat(form.taxaMensal),
        fundoReserva: parseFloat(form.fundoReserva),
      });
      setCondominios((prev) => [novo, ...prev]);
      setModalAberto(false);
      setForm(formVazio);
    } catch (err: unknown) {
      setErroForm(
        (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro ??
          'Erro ao criar condomínio.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await removerCondominio(id);
      setCondominios((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Não foi possível remover o condomínio.');
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando condomínios..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condomínios</h1>
          <p className="mt-1 text-sm text-gray-500">
            {condominios.length} {condominios.length === 1 ? 'condomínio' : 'condomínios'} cadastrado{condominios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Novo condomínio
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {erro}{' '}
          <button onClick={recarregar} className="font-medium underline">
            Tentar novamente
          </button>
        </div>
      )}

      {condominios.length === 0 && !erro && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500">Nenhum condomínio cadastrado ainda.</p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Criar o primeiro
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {condominios.map((condo) => {
          const entradaMensal = condo.taxaMensal;
          const saidaMensal = totalSaidas(condo);
          const resultado = entradaMensal - saidaMensal;

          return (
            <div
              key={condo.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{condo.nome}</h3>
                  <p className="text-xs text-gray-500">{condo.unidades} unidades</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                   resultado >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                 {resultado >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saldo atual</span>
                  <span className={`font-semibold ${condo.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatarMoeda(condo.saldo)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Entrada/mês</span>
                  <span className="font-medium text-gray-800">{formatarMoeda(entradaMensal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saída fixa/mês</span>
                  <span className="font-medium text-gray-800">{formatarMoeda(saidaMensal)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Resultado/mês</span>
                  <span className={`font-semibold ${resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatarMoeda(resultado)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/condominios/${condo.id}`)}
                  className="flex-1 rounded-lg bg-blue-50 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  Ver detalhes
                </button>
                <button
                  onClick={() => handleRemover(condo.id, condo.nome)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Novo condomínio</h2>

            {erroForm && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleCriar} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ex: Edifício Solar das Flores"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Unidades *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.unidades}
                    onChange={(e) => setForm({ ...form, unidades: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Saldo atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.saldo}
                    onChange={(e) => setForm({ ...form, saldo: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Taxa mensal (R$) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.taxaMensal}
                    onChange={(e) => setForm({ ...form, taxaMensal: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="650"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fundo reserva (R$) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fundoReserva}
                    onChange={(e) => setForm({ ...form, fundoReserva: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); setForm(formVazio); setErroForm(''); }}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
