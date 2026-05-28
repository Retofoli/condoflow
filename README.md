# CondoFlow

App web para administradoras de condomínios — dashboard visual, projeção de caixa 12 meses e simulador "E se?".

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Recharts (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Banco:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcrypt

## Setup rápido

### 1. Banco de dados

Crie o banco PostgreSQL e configure o `.env` no servidor:

```bash
cd server
cp .env.example .env
# edite .env com sua DATABASE_URL
```

### 2. Backend

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run db:seed        # cria admin e dados de exemplo
npm run dev            # porta 3001
```

### 3. Frontend

```bash
cd client
npm install
npm run dev            # porta 5173
```

## Login padrão (seed)

- **E-mail:** `admin@condoflow.com`
- **Senha:** `admin123`

## Fases

- **Fase 1 (atual):** Auth + CRUD de condomínios + contas fixas
- **Fase 2:** Motor de projeção financeira + simulador "E se?"
