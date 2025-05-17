// 📦 Dépendances nécessaires
const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔁 Liste des étapes du call
const etapes = [
  "etape1", "etape2", "etape3", "etape4", "etape5",
  "etape6", "etape7", "etape8", "etape9", "etape10", "termine"
];

// 🧪 Test racine
app.get("/", (req, res) => {
  res.send("✅ Serveur vocal IA actif");
});

// 🎯 Génère le TwiML dynamiquement à chaque étape
app.post("/twiml", async (req, res) => {
  const { nom, prenom, civilite, etape_actuelle } = req.body;

  const prompt = `Tu es un assistant vocal intelligent qui appelle un prospect ayant effectué une demande de devis en ligne.

🎯 Objectif :
Poser une série de questions pour mieux comprendre son besoin en panneaux solaires, tout en restant chaleureux et professionnel. À chaque étape, tu poses une question, attends la réponse, valides ou répètes si besoin. Chaque échange suit cette structure :
- Question de l’Agent IA
- Réponse du Prospect
- Validation de la réponse par l’Agent IA
- Si pas de réponse, répète la question jusqu’à 3 fois, puis conclus poliment

📄 Contexte du prospect :
- Civilité : ${civilite} (Monsieur ou Madame)
- Nom : ${nom}
- Prénom : ${prenom}
- Société : Green Impact
- Étape actuelle : ${etape_actuelle}

📌 Étapes possibles et message attendu :

Si l’étape est "etape1", dire :
"Oui bonjour ${civilite} ${nom}, je suis Hector de chez Green Impact. Je fais suite à votre demande de devis en ligne, vous vous en souvenez ?"

Si l’étape est "etape2", dire :
"Avez-vous 5 minutes pour qu’on discute un peu de vos besoins ?"

Si l’étape est "etape3", dire :
"Qu’est-ce qui vous motive à installer des panneaux solaires chez vous ? Pour réduire vos factures ? Pour des raisons écologiques ? Ou pour devenir autonome ?"

Si l’étape est "etape4", dire :
"Avez-vous une idée du montant que vous souhaitez économiser sur vos factures d’énergie ?"

Si l’étape est "etape5", dire :
"Qu’est-ce qui vous a poussé à faire cette demande maintenant ?"

Si l’étape est "etape6", dire :
"Pourriez-vous me parler un peu de votre maison ? Quelle est sa surface, et avez-vous une idée de la surface du toit disponible ?"

Si l’étape est "etape7", dire :
"Pourquoi avez-vous choisi Green Impact ? Qu’est-ce qui vous a attiré chez nous ?"

Si l’étape est "etape8", dire :
"Quel moment vous conviendrait le mieux cette semaine ? J’ai des créneaux disponibles jeudi à 10h ou vendredi à 14h."

Si l’étape est "etape9", dire :
"Parfait. Je vais confirmer notre rendez-vous pour vendredi à 14h. Est-ce que cela vous convient bien ?"

Si l’étape est "etape10", dire :
"Merci beaucoup ${civilite} ${nom}. Vous recevrez un email de confirmation avec toutes les infos nécessaires. Très bonne journée et à bientôt !"

🛠 Format attendu en XML TwiML :
<Response>
  <Gather input="speech" action="/trigger" method="POST">
    <Say voice="Polly.Matthieu" language="fr-FR">[Texte de la question selon l'étape]</Say>
  </Gather>
</Response>

Si aucune réponse n’est détectée après 3 tentatives, dis :
<Response>
  <Say voice="Polly.Matthieu" language="fr-FR">Je n’ai pas réussi à vous entendre. Je vous recontacterai plus tard. Merci !</Say>
</Response>`;

  try {
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
  const next = getNextEtape(current);

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

function getNextEtape(current) {
  const index = etapes.indexOf(current);
  return index < etapes.length - 1 ? etapes[index + 1] : "termine";
}

app.listen(port, () => {
  console.log(`✅ Serveur vocal IA à l'écoute sur le port ${port}`);
});
