# AstroMente — Missão de 30 Dias 🚀

Um jogo educativo infantil, em português, com **tabuada, quiz, revisão espaçada dos erros e recompensas por consistência**.

## Funcionalidades do protótipo

- Missão diária com **20 contas de tabuada + 10 perguntas de quiz (30 perguntas)**, ao longo de 30 dias: até 900 perguntas novas/revisadas.
- Dificuldade por faixa etária: 5–6, 7–9 e 10–12 anos.
- Correção explicada imediatamente após cada resposta.
- Uma questão errada é agendada para **outro dia** e sai da lista de revisão ao ser acertada.
- Mapa de 30 dias, estrelas, conquistas, painel para responsáveis e certificado digital ao concluir a jornada.
- Prêmio registrado pelo responsável, desbloqueado ao completar **30 de 30 missões diárias** — errar não invalida um dia.
- Experiência responsiva, sem anúncios, sem rolagem infinita e sem dependências externas.
- **Seis mundos de aventura** desbloqueados em capítulos de cinco dias, com progresso temático.
- **Leitura das perguntas e explicações em português**, quando o navegador oferece síntese de voz.
- **Exportação de relatório CSV** no painel dos responsáveis, com frequência e desempenho dos 30 dias.

As missões já concluídas permanecem válidas com a quantidade de perguntas que tinham na época; missões em andamento são complementadas, sem apagar respostas, até 30 perguntas.

## Executar

Abra `index.html` por um servidor estático local, por exemplo:

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000`.

## Publicação

No Vercel, configure um projeto com framework **Other** e raiz do projeto contendo `index.html`. Nenhum comando de build é necessário.

## Dados e limitações importantes

**MVP local-first.** Nome de exibição, configurações, progresso e respostas são armazenados somente no `localStorage` do navegador/dispositivo. Ainda **não há sincronização**, contas autenticadas, salvamento em nuvem, PIN parental seguro, confirmação de prêmios no mundo real ou mecanismo à prova de alteração do relógio/dispositivo. Limpar dados do navegador apaga o progresso. **Não trate este protótipo como plataforma pronta para coletar dados pessoais de crianças.**

Próximas etapas para uma versão pública multiusuário: cadastro autenticado do responsável, perfis infantis vinculados, PostgreSQL, políticas LGPD, fluxo de consentimento verificável dos responsáveis, proteção de sessões e backups/restauração. O relatório CSV serve para acompanhamento, não para restaurar o progresso.


## V3 — Conta familiar, nuvem e instalação no celular

- **Cadastro pelo responsável**: e-mail, senha com scrypt e consentimento explícito. A criança usa apenas apelido.
- **Retomar em outro celular**: cookies HttpOnly e progresso protegido por conta em PostgreSQL (Neon). Sem publicidade e sem credenciais no navegador.
- **Instalar no celular**: banner na primeira visita, `beforeinstallprompt` em Android compatível e orientação manual de Compartilhar → Adicionar à Tela de Início no iOS. É um aviso na tela, não uma notificação push.
- **PWA**: manifesto com ícones PNG 192/512, service worker para assets estáticos, sem cache de endpoints de conta.
- **Área dos responsáveis**: vínculo para quem já joga localmente, sair, excluir conta com confirmação de senha.
- **Conflito de dispositivos**: revisão incremental da jornada; alterações simultâneas resultam em conflito para evitar perda silenciosa.

### Ambiente de produção

A aplicação é estática com endpoint serverless `api/account.js` na Vercel. Precisa de `DATABASE_URL` configurada como variável criptografada no projeto, apontando para um PostgreSQL dedicado. Rode a migração na base definida antes de ativar o cadastro (veja `schema.sql`). Em desenvolvimento local, Vercel Dev executa a função; `python -m http.server` serve só o front-end e não executa cadastro.

### Avisos importantes

O consentimento é autodeclarado pelo adulto. A versão não faz verificação do e-mail nem validação independente de titularidade parental. É necessário fazer revisão técnica, jurídica, acessibilidade e proteção contra abuso antes de abrir cadastro infantil em larga escala. O progresso continua com backup no armazenamento local enquanto autenticado.
