# Sanfrei WhatsApp Bot

Bot de atendimento para WhatsApp com menu interativo e respostas por IA para a Sanfrei Tecnologia.

## O que este projeto faz

- Recebe mensagens do WhatsApp via webhook da Evolution API
- Exibe um menu com 6 opcoes principais
- Responde perguntas livres com IA usando a Groq
- Mantem um historico simples por contato

## Menu atual

1. Orcamento / Solicitar proposta
2. Servicos e Solucoes
3. Falar com atendente
4. Demonstracao do sistema
5. Duvidas frequentes
6. Parcerias / Revenda
0. Voltar ao menu principal

## Variaveis de ambiente

- `EVOLUTION_API_URL`: URL publica da sua Evolution API
- `EVOLUTION_API_KEY`: chave configurada na Evolution API
- `GROQ_API_KEY`: chave da Groq para respostas por IA
- `INSTANCE_NAME`: nome da instancia do WhatsApp
- `PORT`: porta do servidor

## Executar localmente

```bash
npm install
npm run dev
```

O servidor inicia em `http://localhost:3000`.

## Deploy no Railway

1. Suba este projeto para o GitHub.
2. No Railway, crie um novo projeto usando `Deploy from GitHub repo`.
3. Selecione o repositorio `SanfreiConnect`.
4. Em `Variables`, cadastre as variaveis de ambiente deste projeto.
5. Depois do deploy, copie a URL publica gerada pelo Railway.
6. Configure o webhook da Evolution API para `https://SEU-DOMINIO/webhook`.

## Observacoes

- O numero pessoal pode funcionar para testes, mas existe risco em integracoes nao oficiais.
- Para producao, o ideal e migrar para um numero comercial dedicado e, depois, avaliar a API oficial do WhatsApp.
