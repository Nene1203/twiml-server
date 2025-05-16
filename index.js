const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

// Middleware pour parser les requêtes POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test racine
app.get("/", (req, res) => {
  res.send("✅ Serveur Twilio opérationnel !");
});

// GET /twiml — test manuel
app.get("/twiml", (req, res) => {
  const message = "Bonjour, ceci est un appel test.";
  console.log("📞 [GET] Appel de test avec message :", message);

  const xml = `
    <Response>
      <Gather input="speech" action="/trigger" method="POST" language="fr-FR" timeout="5">
        <Say voice="Polly.Matthieu" language="fr-FR">Bonjour, dites "Allo" pour commencer.</Say>
      </Gather>
      <Say voice="Polly.Matthieu" language="fr-FR">Je n'ai rien entendu, au revoir.</Say>
    </Response>
  `;

  res.set("Content-Type", "text/xml");
  res.send(xml);
  console.log("📤 XML TwiML envoyé :", xml);
});

// POST /twiml — webhook Twilio
app.post("/twiml", (req, res) => {
  const message = "Bonjour, ceci est un appel test.";
  console.log("📞 [POST] Twilio nous a appelé avec message :", message);

  const xml = `
    <Response>
      <Gather input="speech" action="/trigger" method="POST" language="fr-FR" timeout="5">
        <Say voice="Polly.Matthieu" language="fr-FR">Bonjour, dites "Allo" pour commencer.</Say>
      </Gather>
      <Say voice="Polly.Matthieu" language="fr-FR">Je n'ai rien entendu, au revoir.</Say>
    </Response>
  `;

  res.set("Content-Type", "text/xml");
  res.send(xml);
  console.log("📤 XML TwiML envoyé :", xml);
});

// POST /trigger — retour après parole utilisateur
app.post("/trigger", (req, res) => {
  console.log("📥 Requête POST /trigger reçue");
  console.log("🧾 Body complet :", req.body);

  const transcript = req.body.SpeechResult || "";
  const msg = "Bonjour, ceci est un appel test.";
  console.log("🎤 Réponse vocale détectée :", transcript);

  if (
    transcript.toLowerCase().includes("allo") ||
    transcript.toLowerCase().includes("allô")
  ) {
    res.set("Content-Type", "text/xml");
    res.send(`<Response><Say voice="Polly.Matthieu" language="fr-FR">${msg}</Say></Response>`);
  } else {
    res.set("Content-Type", "text/xml");
    res.send(`<Response><Say voice="Polly.Matthieu" language="fr-FR">Je n'ai pas compris. Merci et à bientôt.</Say></Response>`);
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`✅ TwiML Server is running on port ${port}`);
});
