# AstroMente — Missão de 30 Dias 🚀

Um jogo educativo infantil, em português, com **tabuada, quiz, revisão espaçada dos erros e recompensas por consistência**.

## Funcionalidades do protótipo

- Missão diária com **10 contas de tabuada + 5 perguntas de quiz**.
- Dificuldade por faixa etária: 5–6, 7–9 e 10–12 anos.
- Correção explicada imediatamente após cada resposta.
- Uma questão errada é agendada para **outro dia** e sai da lista de revisão ao ser acertada.
- Mapa de 30 dias, estrelas, conquistas, painel para responsáveis e certificado digital ao concluir a jornada.
- Prêmio registrado pelo responsável, desbloqueado ao completar **30 de 30 missões diárias** — errar não invalida um dia.
- Experiência responsiva, sem anúncios, sem rolagem infinita e sem dependências externas.
- **Seis mundos de aventura** desbloqueados em capítulos de cinco dias, com progresso temático.
- **Leitura das perguntas e explicações em português**, quando o navegador oferece síntese de voz.
- **Exportação de relatório CSV** no painel dos responsáveis, com frequência e desempenho dos 30 dias.

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