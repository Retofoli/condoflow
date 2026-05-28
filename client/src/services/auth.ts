import api from './api';
import { AuthResponse, Usuario } from '../types';

export async function login(email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, senha });
  return data;
}

export async function me(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me');
  return data;
}
