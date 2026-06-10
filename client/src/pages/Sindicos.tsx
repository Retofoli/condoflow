import { useEffect, useState } from 'react';
import {
  getSindicos,
  criarSindico,
  removerSindico,
  CondominioComSindico,
} from '../services/sindicos';

export default function Sindicos() {
  const [condominios, setCondominios] = useState<CondominioComSindico[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [condominioId, setCondominioId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const semSindico = condominios.filter(c => !c.sindico);

  async function carregar() {
    try {
      const data = await getSindicos();
      setCondominios(data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriar() {
    if (!nome || !email || !senha || !condominioId) {
      setMensagem('Preencha todos os campos.');
      return;
    }
    setSalvando(true);
    setMensagem('');
    try {
      await criarSindico({ nome, email, senha, condominioId });
      setNome('');
      setEmail('');
      setSenha('');
      setCondominioId('');
      setMensagem('Síndico criado com sucesso!');
      await carregar();
    } catch (err: any) {
      setMensagem(err?.response?.data?.erro ?? 'Erro ao criar síndico.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(sindicoId: string, nomeSindico: string) {
    if (!confirm(`Remover o acesso de ${nomeSindico}? Ele não conseguirá mais entrar no sistema.`)) return;
    try {
      await removerSindico(sindicoId);
      setMensagem('Acesso removido.');
      await carregar();
    } catch {
      setMensagem('Erro ao remover síndico.');
    }
  }

  if (carregando) {
    return <div className="p-6 text-center text-gray-400">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Gestão de Síndicos</h1>
      <p className="text-gray-500 mb-6">
        Crie o acesso do síndico para que ele visualize o painel do condomínio dele.
      </p>

      {/* Formulário de criação */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-600 mb-4">Novo síndico</h2>

        {semSindico.length === 0 ? (
          <p className="text-sm text-gray-400">
            Todos os condomínios já possuem síndico cadastrado.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Condomínio</label>
                <select
                  value={condominioId}
                  onChange={e => setCondominioId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {semSindico.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome do síndico</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">E-mail (será o login)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex: joao@email.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Senha (mínimo 6 caracteres)</label>
                <input
                  type="text"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Senha inicial do síndico"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCriar}
                disabled={salvando}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
                           text-white rounded-lg px-5 py-2 text-sm font-medium"
              >
                {salvando ? 'Criando...' : 'Criar acesso'}
              </button>
            </div>
          </>
        )}

        {mensagem && (
          <p className={`text-sm mt-3 ${
            mensagem.includes('sucesso') || mensagem.includes('removido')
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {mensagem}
          </p>
        )}
      </div>

      {/* Lista de condomínios e síndicos */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-medium text-gray-600">Síndicos por condomínio</h2>
        </div>
        <ul>
          {condominios.map(c => (
            <li key={c.id} className="px-5 py-4 border-t first:border-t-0 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{c.nome}</p>
                {c.sindico ? (
                  <p className="text-sm text-gray-500">
                    {c.sindico.nome} — {c.sindico.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sem síndico cadastrado</p>
                )}
              </div>
              {c.sindico && (
                <button
                  onClick={() => handleRemover(c.sindico!.id, c.sindico!.nome)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remover acesso
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}