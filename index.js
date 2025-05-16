const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

// Middleware pour parser le corps des requêtes POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route racine pour tester si le serveur est en ligne
app.get("/", (req, res) => {
  res.send("✅ Serveur Twilio opérationnel !");
});

// GET /twiml — test dans navigateur
app.get("/twiml", (req, res) => {
  const message = "Bonjour, ceci est un appel test.";
  console.log("📞 [GET] Appel de test avec message :", message);

  const xml = `
    <Response>
      <Gather input="speech" action="/trigger" method="POST" language="fr-FR" timeout="5">
        <Say voice="Polly.Matthieu" language="fr-FR">
          Bonjour, dites "Allo" pour commencer.
        </Say>
      </Gather>
      <Say voice="Polly.Matthieu" language="fr-FR">
        Je n'ai rien entendu, au revoir.
      </Say>
    </Response>
  `;

  res.set("Content-Type", "text/xml");
  res.send(xml);
  console.log("📤 XML TwiML envoyé :", xml);
});

// POST /twiml — pour Twilio
app.post("/twiml", (req, res) => {
  const message = "Bonjour, ceci est un appel test.";
  console.log("📞 [POST] Twilio nous a appelé avec message :", message);

  const xml = `
    <Response>
      <Gather input="speech" action="/trigger" method="POST" language="fr-FR" timeout="5">
        <Say voice="Polly.Matthieu" language="fr-FR">
          Bonjour, dites "Allo" pour commencer.
        </Say>
      </Gather>
      <Say voice="Polly.Matthieu" language="fr-FR">
        Je n'ai rien entendu, au revoir.
      </Say>
    </Response>
  `;

  res.set("Content-Type", "text/xml");
  res.send(xml);
  console.log("📤 XML TwiML envoyé :", xml);
});

// POST /trigger — déclenché quand l'utilisateur parle
app.post("/trigger", (req, res) => {
  console.log("📥 Requête POST /trigger reçue");
  console.log("🧾 Body complet :", req.body);

  const transcript = req.body.SpeechResult || "";
  const msg = "Bonjour, ceci est un appel test.";
  console.log("🎤 Réponse vocale détectée :", transcript);

  if (
    transcript.toLowerCase().includes("allô") ||
    transcript.toLowerCase().includes("allo")
  ) {
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Say voice="Polly.Matthieu" language="fr-FR">
          ${msg}
        </Say>
      </Response>
    `);
  } else {
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Say voice="Polly.Matthieu" language="fr-FR">
          Je n'ai pas compris. Merci et à bientôt.
        </Say>
      </Response>
    `);
  }
});

// Lancement du serveur
app.listen(port, () => {
  console.log(`✅ TwiML Server is running on port ${port}`);
});
