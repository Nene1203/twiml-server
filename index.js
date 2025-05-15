const express = require("express");
const app = express();
const port = process.env.PORT || 80;

// 🔧 Middleware pour parser les requêtes POST de Twilio
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔹 Route racine pour tester si le serveur tourne
app.get("/", (req, res) => {
  res.send("✅ Serveur Twilio opérationnel !");
});

// 🔹 TwiML de démarrage (Twilio appelle ici dès que l'appel commence)
app.get("/twiml", (req, res) => {
  const message = "Bonjour, ceci est un appel test."; // 👈 FIXÉ ici
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

  console.log("✅ Twilio nous a bien appelé !");
  res.set("Content-Type", "text/xml");
  res.send(xml);
  console.log("📤 XML TwiML envoyé :", xml);
});

// 🔹 Analyse la réponse vocale ("Allô" ou non)
app.post("/trigger", (req, res) => {
  console.log("📥 Requête POST /trigger reçue");
  console.log("🧾 Body complet :", req.body);

  const transcript = req.body.SpeechResult || "";
  const message = "Bonjour, ceci est un appel test."; // 👈 FIXÉ aussi ici

  console.log("🎤 Réponse vocale détectée :", transcript);

  if (
    transcript.toLowerCase().includes("allô") ||
    transcript.toLowerCase().includes("allo")
  ) {
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Say voice="Polly.Matthieu" language="fr-FR">
          ${message}
        </Say>
      </Response>
    `);
  } else {
    console.log("✅ Twilio nous a bien appelé !");
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

// 🔚 Démarre le serveur
app.listen(port, () => {
  console.log(`✅ TwiML Server with voice detection is running on port ${port}`);
});
