import { useState, useEffect, useCallback } from 'react';
import { Usuario } from '../types';
import { me } from '../services/auth';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: localStorage.getItem('condoflow_token'),
    carregando: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('condoflow_token');
    if (!token) {
      setState({ usuario: null, token: null, carregando: false });
      return;
    }

    me()
      .then((usuario) => setState({ usuario, token, carregando: false }))
      .catch(() => {
        localStorage.removeItem('condoflow_token');
        localStorage.removeItem('condoflow_usuario');
        setState({ usuario: null, token: null, carregando: false });
      });
  }, []);

  const login = useCallback((token: string, usuario: Usuario) => {
    localStorage.setItem('condoflow_token', token);
    localStorage.setItem('condoflow_usuario', JSON.stringify(usuario));
    setState({ usuario, token, carregando: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('condoflow_token');
    localStorage.removeItem('condoflow_usuario');
    setState({ usuario: null, token: null, carregando: false });
  }, []);

  return { ...state, login, logout };
}
