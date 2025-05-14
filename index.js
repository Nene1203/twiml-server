const express = require("express");
const app = express();
const port = process.env.PORT || 80;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Serveur Twilio opérationnel !");
});

app.get("/twiml", (req, res) => {
  const message = req.query.msg || "Bonjour, ceci est un appel test.";
  console.log("📞 Appel démarré avec message :", message);

  const xml = `
    <Response>
      <Gather input="speech" action="/trigger" method="POST" language="fr-FR" timeout="5">
        <Say voice="Polly.Matthieu" language="fr-FR">
          Bonjour, dites "Allô" pour commencer.
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

app.post("/trigger", (req, res) => {
  console.log("📥 Requête POST /trigger reçue");
  console.log("🧾 Body complet :", req.body);

  const transcript = req.body.SpeechResult || "";
  const msg = req.query.msg
    ? decodeURIComponent(req.query.msg)
    : "Bonjour, ceci est un appel test.";

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

app.listen(port, () => {
  console.log(`✅ TwiML Server with voice detection is running on port ${port}`);
});
