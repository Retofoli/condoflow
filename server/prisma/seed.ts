import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@condoflow.com' },
    update: {},
    create: {
      email: 'admin@condoflow.com',
      senha: senhaHash,
      perfil: 'ADMIN',
      nome: 'Administradora CondoFlow',
    },
  });

  const condo1 = await prisma.condominio.upsert({
    where: { id: 'condo-exemplo-1' },
    update: {},
    create: {
      id: 'condo-exemplo-1',
      nome: 'Edifício Solar das Flores',
      saldo: 45000,
      unidades: 24,
      taxaMensal: 650,
      fundoReserva: 80,
      adminId: admin.id,
      contasFixas: {
        create: [
          { nome: 'Energia elétrica (áreas comuns)', valor: 1800, diaVencimento: 10, categoria: 'Energia' },
          { nome: 'Água e esgoto', valor: 2200, diaVencimento: 15, categoria: 'Água' },
          { nome: 'Portaria (empresa terceirizada)', valor: 5500, diaVencimento: 5, categoria: 'Pessoal' },
          { nome: 'Seguro do condomínio', valor: 420, diaVencimento: 20, categoria: 'Seguros' },
          { nome: 'Manutenção elevadores', valor: 900, diaVencimento: 8, categoria: 'Manutenção' },
        ],
      },
    },
  });

  const condo2 = await prisma.condominio.upsert({
    where: { id: 'condo-exemplo-2' },
    update: {},
    create: {
      id: 'condo-exemplo-2',
      nome: 'Residencial Parque Verde',
      saldo: 18500,
      unidades: 12,
      taxaMensal: 480,
      fundoReserva: 60,
      adminId: admin.id,
      contasFixas: {
        create: [
          { nome: 'Energia elétrica (áreas comuns)', valor: 750, diaVencimento: 10, categoria: 'Energia' },
          { nome: 'Água e esgoto', valor: 980, diaVencimento: 15, categoria: 'Água' },
          { nome: 'Limpeza (diarista 3x/semana)', valor: 1200, diaVencimento: 5, categoria: 'Pessoal' },
          { nome: 'Internet coletiva', valor: 180, diaVencimento: 22, categoria: 'Serviços' },
        ],
      },
    },
  });

  console.log('Seed concluído!');
  console.log(`Admin: ${admin.email}`);
  console.log(`Condomínio 1: ${condo1.nome}`);
  console.log(`Condomínio 2: ${condo2.nome}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
