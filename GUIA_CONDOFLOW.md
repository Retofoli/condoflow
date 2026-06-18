# CondoFlow — Guia do Desenvolvedor Iniciante

Meu passo a passo: conceitos, comandos e soluções de problemas.
Escrito a partir do que já construí com a ajuda do Claude.

---

## Como usar este guia

Este é o meu manual de bolso do CondoFlow. Quando bater uma dúvida — "como ligo o
projeto?", "o que faço quando dá esse erro?", "como salvo na nuvem?" — abro aqui e
procuro a seção certa. Não precisa decorar nada; o objetivo é consultar e ir
aprendendo no caminho.

---

## 1. As peças do projeto (conceitos)

O CondoFlow é um aplicativo web. Por baixo, ele tem algumas peças que conversam
entre si.

- **Frontend — a parte visual.** Tudo que aparece na tela: botões, telas, gráficos,
  cores. Fica na pasta `client`. Usa React, TypeScript, Tailwind e Recharts (gráficos).
- **Backend — o motor por trás.** A parte invisível que recebe pedidos, faz contas e
  guarda/busca dados. Fica na pasta `server`. Usa Node + Express, Prisma e JWT (login).
- **Banco de dados — onde tudo fica guardado.** Condomínios, usuários, contas, valores.
  É PostgreSQL, hospedado na nuvem no serviço Neon.
- **GitHub — o cofre na nuvem.** Onde o código fica guardado na internet
  (github.com/Retofoli/condoflow). O "push" protege todo o trabalho.

Ferramentas que eu uso:
- **Cursor** — onde vejo/edito os arquivos e abro os terminais.
- **Terminal (PowerShell)** — onde digito comandos.
- **Claude Code** — assistente que roda no terminal, lê o projeto e escreve o código.

> Observação: no plano gratuito, o banco Neon "dorme" quando fica sem uso. A primeira
> tentativa de login depois disso pode falhar — espere uns segundos e tente de novo.

---

## 2. Como ligar o projeto (receita do dia a dia)

Duas peças precisam estar ligadas ao mesmo tempo: backend e frontend. Cada uma no seu
próprio terminal.

**Passo 1 — Ligar o backend (o motor)**
Abra um terminal (Terminal → New Terminal) e digite:

    cd C:\Users\Renata\CondoFlow\server
    npm run dev

Espere "CondoFlow API rodando em http://localhost:3001". Deixe o terminal rodando.

**Passo 2 — Ligar o frontend (a tela)**
Abra OUTRO terminal:

    cd C:\Users\Renata\CondoFlow\client
    npm run dev

Espere "Local: http://localhost:5173/".

**Passo 3 — Abrir no navegador**
Acesse http://localhost:5173.
- Admin: admin@condoflow.com
- Síndico de teste: sindico.teste@condoflow.com / senha teste123

> Os dois motores precisam estar ligados juntos. Se o site abrir mas der erro ao logar,
> quase sempre é o backend que não está rodando.

---

## 3. Trabalhando com o Claude Code

O Claude Code escreve o código direto no projeto. Eu fico no comando: peço, ele propõe,
eu reviso e aprovo.

**Como abrir:**

    cd C:\Users\Renata\CondoFlow
    claude

**O ritual seguro (sempre nesta ordem):**
1. Peço o que quero e peço para ele PRIMEIRO mostrar um plano, sem alterar arquivos.
2. Leio o plano. Se não for o que quis, corrijo e peço um novo.
3. Só quando o plano estiver certo, aprovo.
4. Ele edita e pede permissão. Escolho "Yes" (setas do teclado + Enter).
5. Quando termina, testo no navegador e salvo no Git.

**Detalhes úteis:**
- No terminal não dá para clicar — use as setas do teclado.
- Para colar: botão direito do mouse ou Ctrl+Shift+V (o Ctrl+V comum costuma falhar).
- Esc interrompe; `exit` sai.
- Se ele quiser rodar `npm run dev` sozinho, eu recuso (No) e ligo o site do meu jeito.

> Revisar o plano antes de aprovar é a parte mais importante.

---

## 4. Salvar o trabalho (Git e nuvem)

Duas etapas: "commit" (guarda versão na máquina) e "push" (manda para o GitHub).

**Salvar uma versão (commit):**

    cd C:\Users\Renata\CondoFlow
    git add .
    git commit -m "descrição curta do que mudou"

**Conferir o estado:**

    git status

"nothing to commit, working tree clean" = tudo salvo.
"ahead of origin/master by X commits" = X versões esperando para subir à nuvem.

**Mandar para a nuvem (push):**

    git push origin master

Terminou com "master -> master" = projeto seguro no GitHub. Não aperte Ctrl+C durante o push.

**Continuar numa máquina nova:**
1. Instalar Node.js, Git e Cursor.
2. `git clone https://github.com/Retofoli/condoflow.git`
3. `npm install` dentro de `client` e dentro de `server`.
4. Recriar `server/.env` com a conexão do banco (fica fora do GitHub por segurança).

> O `.env` tem a senha do banco e nunca vai para o GitHub. Guarde o conteúdo num lugar
> seguro. É a única peça que não está na nuvem.

---

## 5. Livro de receitas dos perrengues

**"EADDRINUSE: address already in use :::3001"**
Já existe um servidor rodando na porta 3001 (fantasma de sessão anterior). Resolver:

    Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
    npm run dev

**"ECONNREFUSED" em /api/auth/login (terminal do frontend)**
A tela está no ar mas não fala com o backend — o backend não está rodando. Ligue o
backend (Seção 2). Para confirmar que está vivo:

    Invoke-RestMethod -Uri "http://localhost:3001/api/health"

Se responder "status: ok", está funcionando.

**"Can't reach database server / PrismaClientInitializationError"**
O banco Neon não respondeu (geralmente estava dormindo). No terminal do backend digite
`rs` (ou Ctrl+C e `npm run dev`), espere 20–30s e tente logar de novo. Se persistir,
abra neon.tech para acordar o banco.

**"Port 5173 is in use, trying another one..."**
Já há um frontend na 5173, e o Vite abriu outro na 5174. Como o backend só conversa com
a 5173, use http://localhost:5173 (o que já estava no ar) ou feche o extra com Ctrl+C.

**O Cursor abriu um arquivo "Untitled" e salvou o código no lugar errado**
O Ctrl+V caiu num arquivo novo sem nome. Selecione tudo no Untitled (Ctrl+A), copie,
clique na aba do arquivo certo, selecione tudo (Ctrl+A) e cole por cima. Salve e feche
o Untitled sem salvar. Dica: antes de colar, clique DENTRO do arquivo de destino e
confira o nome na aba.

**O .gitignore não está ignorando o node_modules**
Foi salvo em codificação que o Git não lê (UTF-16). Abra no Cursor, clique no indicador
de codificação no canto inferior direito, "Save with Encoding" → UTF-8. Conteúdo certo
(cada um numa linha): node_modules/ , .env , *.log

**A grande pegadinha do Ctrl+C no terminal**
No terminal, Ctrl+C NÃO copia — ele PARA o que está rodando. Para copiar, selecione com
o mouse e use Ctrl+Shift+C. Para parar um servidor de propósito, aí sim Ctrl+C é o certo.

---

## 6. Glossário rápido

- **Frontend** — parte visual (telas, gráficos). Pasta `client`.
- **Backend** — motor que faz contas e guarda dados. Pasta `server`.
- **Banco de dados** — onde tudo fica salvo. PostgreSQL no Neon.
- **Terminal** — janela onde digito comandos.
- **Servidor** — programa que fica ligado esperando pedidos (o backend é um).
- **Commit** — salvar uma versão na minha máquina.
- **Push** — mandar as versões salvas para a nuvem (GitHub).
- **Porta (ex: 3001)** — "número de canal" onde um servidor atende.
- **localhost** — o meu próprio computador, quando testo o site nele.
- **npm run dev** — comando que liga o backend ou o frontend.
- **Claude Code** — assistente que escreve o código no terminal.

---

*Este guia cresce comigo. A cada etapa nova do CondoFlow, posso adicionar uma seção
com o que aprendi.*
