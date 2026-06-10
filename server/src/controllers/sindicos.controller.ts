import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

// Lista os condomínios da administradora com seus síndicos (ou sem, se vazio)
export async function listar(req: Request, res: Response): Promise<void> {
  const condominios = await prisma.condominio.findMany({
    where: { adminId: req.user!.id },
    select: {
      id: true,
      nome: true,
      sindico: { select: { id: true, nome: true, email: true, criadoEm: true } },
    },
    orderBy: { nome: 'asc' },
  });
  res.json(condominios);
}

// Cria o usuário síndico e associa ao condomínio
export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, email, senha, condominioId } = req.body as {
    nome?: string; email?: string; senha?: string; condominioId?: string;
  };

  if (!nome || !email || !senha || !condominioId) {
    res.status(400).json({ erro: 'Nome, e-mail, senha e condomínio são obrigatórios.' });
    return;
  }
  if (senha.length < 6) {
    res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  // O condomínio precisa ser da administradora logada
  const condominio = await prisma.condominio.findFirst({
    where: { id: condominioId, adminId: req.user!.id },
  });
  if (!condominio) {
    res.status(404).json({ erro: 'Condomínio não encontrado.' });
    return;
  }
  if (condominio.sindicoId) {
    res.status(409).json({ erro: 'Este condomínio já possui um síndico. Remova o acesso atual primeiro.' });
    return;
  }

  const emailExiste = await prisma.usuario.findUnique({ where: { email } });
  if (emailExiste) {
    res.status(409).json({ erro: 'Já existe um usuário com este e-mail.' });
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // Transação: cria o usuário E associa ao condomínio — ou tudo, ou nada
  const sindico = await prisma.$transaction(async (tx) => {
    const novo = await tx.usuario.create({
      data: { nome, email, senha: senhaHash, perfil: 'SINDICO' },
    });
    await tx.condominio.update({
      where: { id: condominioId },
      data: { sindicoId: novo.id },
    });
    return novo;
  });

  res.status(201).json({ id: sindico.id, nome: sindico.nome, email: sindico.email, condominioId });
}

// Remove o acesso do síndico (desassocia e apaga o usuário)
export async function remover(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const condominio = await prisma.condominio.findFirst({
    where: { sindicoId: id, adminId: req.user!.id },
  });
  if (!condominio) {
    res.status(404).json({ erro: 'Síndico não encontrado nos seus condomínios.' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.condominio.update({ where: { id: condominio.id }, data: { sindicoId: null } });
    await tx.usuario.delete({ where: { id } });
  });

  res.json({ ok: true });
}