const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = "https://discord.com/api/webhooks/1388339011554119733/QOb0ZjK1K4up3sagGToUwXaCREUx29GgZ3GsmaEBYsHF463u_qxoHQRklK_WrlaD4wl-"; // 🔁 troque pelo seu webhook

app.use(cors());
app.use(express.json());

const keys = new Map();

// 🟢 Rota raiz para mostrar que o backend está online
app.get("/", (req, res) => {
  res.send("🟢 Backend Tony_Dev online!");
});

// 🔑 Rota para gerar key (1 por IP a cada 24h)
app.get("/generate-key", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();

  if (keys.has(ip) && now < keys.get(ip).expiresAt) {
    return res.status(429).json({
      error: "Você já gerou uma key nas últimas 24 horas.",
    });
  }

  const key = crypto.randomUUID();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 horas

  keys.set(ip, { key, expiresAt });

  // Envia log para o webhook
  axios.post(WEBHOOK_URL, {
    embeds: [
      {
        title: "🔐 Nova Key Gerada",
        color: 0x00ff00,
        fields: [
          { name: "IP", value: `\`${ip}\``, inline: false },
          { name: "Key", value: `\`${key}\``, inline: false },
          { name: "Expira em", value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: false }
        ],
        footer: {
          text: "By Tony_Dev"
        },
        timestamp: new Date().toISOString()
      }
    ]
  }).catch(console.error);

  res.json({ key, expiresAt });
});

// ✅ Rota para validar key
app.post("/validate-key", (req, res) => {
  const { key } = req.body;
  const now = Date.now();

  const isValid = Array.from(keys.values()).some(
    (entry) => entry.key === key && now < entry.expiresAt
  );

  res.json({ valid: isValid });
});

// 🚀 Inicialização do servidor
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});