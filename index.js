require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "1mb" }));

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || "").replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const INSTANCE_NAME = process.env.INSTANCE_NAME || "sanfrei";
const PORT = Number(process.env.PORT || 3000);

const sessions = {};

const MENU_PRINCIPAL = `Ola! Seja bem-vindo a *Sanfrei Tecnologia*!

Somos especialistas em desenvolvimento de sistemas, automacao e solucoes digitais.

Como posso te ajudar hoje? Escolha uma opcao:

1 - Orcamento / Solicitar proposta
2 - Servicos e Solucoes
3 - Falar com atendente
4 - Demonstracao do sistema
5 - Duvidas frequentes
6 - Parcerias / Revenda

Ou descreva o que precisa e eu tento ajudar. Envie *0* para ver este menu novamente.`;

const RESPOSTAS_MENU = {
  "1": `*Orcamento / Solicitar proposta*

Perfeito. Para montar uma proposta personalizada, me envie:
- Qual sistema, integracao ou automacao voce precisa
- Qual e o segmento da sua empresa
- Se existe prazo ou urgencia

Assim nossa equipe consegue retornar com mais precisao.

Envie *0* para voltar ao menu.`,

  "2": `*Servicos e Solucoes Sanfrei*

Atuamos com:
- Desenvolvimento de sistemas web
- Integracao de APIs e sistemas corporativos
- Plataformas SaaS
- Automacao de processos
- Solucoes corporativas sob medida
- Chatbots e inteligencia artificial

Se quiser, me diga qual dessas areas voce quer entender melhor.

Envie *0* para voltar ao menu.`,

  "3": `*Falar com atendente*

Seu interesse foi registrado. Um atendente humano pode continuar o atendimento no horario comercial.

Horario de atendimento:
Segunda a sexta: 8h as 18h
Sabado: 9h as 13h

Contato:
Telefone: (11) 97558-2323
E-mail: contato@sanfreitecnologia.com

Envie *0* para voltar ao menu.`,

  "4": `*Demonstracao do sistema*

Podemos apresentar uma demonstracao para voce.

Para agilizar, envie:
- Seu nome
- Nome da empresa
- Melhor dia e horario para a demonstracao

Envie *0* para voltar ao menu.`,

  "5": `*Duvidas frequentes*

1. Quanto tempo leva um projeto?
Depende da complexidade. Projetos menores podem levar poucas semanas e sistemas maiores exigem mais etapas.

2. Voces oferecem suporte apos a entrega?
Sim. A Sanfrei pode continuar com manutencao e evolucao da solucao.

3. Trabalham com empresas de qualquer porte?
Sim. Atendemos desde operacoes menores ate empresas com necessidades mais complexas.

4. Voces integram sistemas com WhatsApp?
Sim. Esse e um dos tipos de solucao que podemos desenvolver.

Se quiser, envie sua duvida.

Envie *0* para voltar ao menu.`,

  "6": `*Parcerias / Revenda*

Temos interesse em parcerias comerciais e tecnicas.

Para continuar, envie:
- Seu nome
- Nome da empresa
- Tipo de parceria de interesse

Exemplos:
- Revenda
- Parceria tecnica
- Parceria comercial
- White label

Envie *0* para voltar ao menu.`,
};

const SYSTEM_PROMPT = `Voce e o assistente virtual da Sanfrei Tecnologia, empresa brasileira especializada em desenvolvimento de sistemas, integracao de APIs, automacao e solucoes digitais.

Diretrizes:
- Responda sempre em portugues do Brasil.
- Seja objetivo, cordial e comercial.
- Use no maximo 3 paragrafos curtos.
- Nao invente precos, prazos fechados ou promessas tecnicas sem contexto.
- Quando faltar informacao, diga que a equipe pode validar os detalhes.
- Sempre que fizer sentido, oriente o cliente a enviar 0 para ver o menu principal.`;

function isConfigured() {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

function getSession(from) {
  if (!sessions[from]) {
    sessions[from] = {
      history: [],
      lastInteraction: Date.now(),
      menuShown: false,
    };
  }

  sessions[from].lastInteraction = Date.now();
  return sessions[from];
}

async function sendMessage(to, message) {
  if (!isConfigured()) {
    console.warn("Evolution API nao configurada. Mensagem nao enviada.");
    return;
  }

  try {
    await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      { number: to, text: message },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.response?.data || error.message);
  }
}

async function askGroq(userMessage, history) {
  if (!GROQ_API_KEY) {
    return "Posso te ajudar com informacoes iniciais, mas a IA ainda nao foi configurada. Envie *0* para ver o menu principal ou aguarde um atendente.";
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: "user", content: userMessage },
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 300,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data?.choices?.[0]?.message?.content?.trim() || "Nao consegui gerar uma resposta agora. Envie *0* para ver o menu.";
  } catch (error) {
    console.error("Erro Groq:", error.response?.data || error.message);
    return "Tive um problema para processar sua mensagem agora. Envie *0* para ver o menu ou tente novamente em instantes.";
  }
}

function extractIncomingMessage(body) {
  const data = body?.data;
  const from = data?.key?.remoteJid;
  const message =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    "";

  return {
    from,
    fromMe: Boolean(data?.key?.fromMe),
    text: String(message || "").trim(),
  };
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Sanfrei WhatsApp Bot",
    evolutionConfigured: isConfigured(),
    groqConfigured: Boolean(GROQ_API_KEY),
  });
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const { from, fromMe, text } = extractIncomingMessage(req.body);

    if (fromMe || !from || !text) {
      return;
    }

    const session = getSession(from);
    console.log(`[${from}] -> ${text}`);

    if (text === "0" || text.toLowerCase() === "menu") {
      session.menuShown = true;
      await sendMessage(from, MENU_PRINCIPAL);
      return;
    }

    if (!session.menuShown) {
      session.menuShown = true;
      await sendMessage(from, MENU_PRINCIPAL);
      return;
    }

    if (RESPOSTAS_MENU[text]) {
      session.history.push({ role: "user", content: text });
      session.history.push({ role: "assistant", content: RESPOSTAS_MENU[text] });
      await sendMessage(from, RESPOSTAS_MENU[text]);
      return;
    }

    const reply = await askGroq(text, session.history);
    session.history.push({ role: "user", content: text });
    session.history.push({ role: "assistant", content: reply });

    await sendMessage(from, reply);
  } catch (error) {
    console.error("Erro no webhook:", error.response?.data || error.message);
  }
});

setInterval(() => {
  const now = Date.now();
  for (const from of Object.keys(sessions)) {
    if (now - sessions[from].lastInteraction > 60 * 60 * 1000) {
      delete sessions[from];
    }
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Sanfrei Bot iniciado na porta ${PORT}`);
});
