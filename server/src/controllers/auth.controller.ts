import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, senha } = req.body as { email?: string; senha?: string };

  if (!email || !senha) {
    res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    return;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    return;
  }

  const token = jwt.sign(
    { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
}

export async function me(req: Request, res: Response): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.id },
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true },
  });

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return;
  }

  res.json(usuario);
}
