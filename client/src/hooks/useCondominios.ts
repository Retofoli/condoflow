import { useState, useEffect } from 'react';
import { Condominio } from '../types';
import { listarCondominios } from '../services/condominios';

export function useCondominios() {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await listarCondominios();
      setCondominios(dados);
    } catch {
      setErro('Não foi possível carregar os condomínios.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  return { condominios, carregando, erro, recarregar: carregar, setCondominios };
}
