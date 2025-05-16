// 📦 Dépendances nécessaires
const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔁 Liste des étapes du call
const etapes = [
  "Etape 1 - Introduction",
  "Etape 2 - Disponibilité",
  "Etape 3 - Motivation",
  "Etape 4 - Budget",
  "Etape 5 - Timing",
  "Etape 6 - Infos maison",
  "Etape 7 - Pourquoi Green Impact",
  "Etape 8 - Proposition RDV",
  "Etape 9 - Confirmation RDV",
  "Etape 10 - Conclusion",
  "Terminé"
];

// 🧪 Test racine
app.get("/", (req, res) => {
  res.send("✅ Serveur vocal IA actif");
});

// 🎯 Génère le TwiML dynamiquement à chaque étape
app.post("/twiml", async (req, res) => {
  const data = req.body;
  const { nom, prenom, civilite, etape_actuelle } = data;

  try {
    const prompt = `Tu es un assistant vocal intelligent qui appelle un prospect ayant effectué une demande de devis en ligne. \n\nVoici le contexte :\n- Prénom : ${prenom}\n- Nom : ${nom}\n- Statut : ${civilite}\n- Société : Green Impact\n- Objectif : prendre un rendez-vous pour parler du projet de panneaux solaires\n- Ton : chaleureux, professionnel, clair\n\nEtape actuelle : ${etape_actuelle}\n\nStructure obligatoire :\n- Question à poser (voix IA)\n- Si une réponse du prospect est détectée : valider la réponse par un court message\n- Sinon : reformuler ou conclure si 3 tentatives échouent\n\nFormat : XML TwiML avec voix masculine Polly.Mathieu`;

    const gptResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "Tu es un assistant vocal Twilio." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const twiml = gptResponse.data.choices[0].message.content;
    res.set("Content-Type", "text/xml");
    res.send(twiml);
  } catch (err) {
    console.error("❌ Erreur GPT-4:", err.response?.data || err.message);
    res.status(500).send("<Response><Say language='fr-FR'>Une erreur est survenue.</Say></Response>");
  }
});

// 🔄 Gère le retour vocal utilisateur + mise à jour Airtable
app.post("/trigger", async (req, res) => {
  const { SpeechResult, CallSid } = req.body;
  console.log("📥 Reçu de Twilio:", SpeechResult);

  // TODO: Récupérer l'enregistrement Airtable lié au CallSid (ou téléphone)
  const record = await findRecordByCallSid(CallSid); // fonction fictive 

  const current = record.fields["etape actuelle"];
  const i = etapes.indexOf(current);
  const next = etapes[i + 1] || "Terminé";

  // 🔃 Mise à jour Airtable
  await axios.patch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${record.id}`,
    { fields: { "etape actuelle": next, "réponse précédente": SpeechResult } },
    { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, "Content-Type": "application/json" } }
  );

  // 🔁 Reboucle sur la prochaine question
  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Redirect method="POST">/twiml</Redirect>
    </Response>
  `);
});

app.listen(port, () => {
  console.log(`✅ Serveur vocal IA à l'écoute sur le port ${port}`);
});
