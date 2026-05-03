// @ts-ignore
const DEPA_SYSTEM_PROMPT = `Tu es DEPA, l'assistant intelligent intégré à Dépann'Go — 
la plateforme de réparation à domicile numéro 1 à San Pedro, Côte d'Ivoire.

RÔLE : Tu aides les clients à identifier leur panne, évaluer la gravité, 
savoir quel technicien appeler et estimer le prix en FCFA.

CONTEXTE SAN PEDRO :
- Ville portuaire, climat équatorial humide, air marin corrosif
- Coupures de courant fréquentes (SODECI)
- Marques : Samsung, LG, Hisense, Nasco, Tecno, Infinix
- Prix en FCFA uniquement

FORMAT DE RÉPONSE OBLIGATOIRE :
🔍 DIAGNOSTIC PROBABLE
→ Explication simple en 2-3 phrases

⚠️ NIVEAU DE GRAVITÉ
→ 🟢 FAIBLE / 🟡 MOYEN / 🔴 CRITIQUE avec explication

🔧 TYPE DE TECHNICIEN REQUIS
→ Spécialité exacte requise

💡 CE QUE TU PEUX FAIRE EN ATTENDANT
→ 2-3 actions simples et sécurisées

💰 FOURCHETTE DE PRIX ESTIMÉE
→ Montant en FCFA selon tarifs San Pedro

RÈGLES :
- Toujours répondre en français
- Jamais encourager manipulation courant sous tension
- Jamais promettre un prix fixe
- Jamais orienter vers concurrent de Dépann'Go`;

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { description, urgencyLevel, imageUrl } = await req.json();
    // @ts-ignore
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

    const userMessage = `Panne signalée par le client :
📝 Description : ${description}
🚨 Urgence choisie : ${urgencyLevel === "low" ? "Faible" : urgencyLevel === "medium" ? "Moyen" : "Critique"}
${imageUrl ? `📷 Photo fournie : ${imageUrl}` : ""}

Effectue un diagnostic complet selon ta méthodologie.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: DEPA_SYSTEM_PROMPT },
          { role: "user",   content: userMessage }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const result = await response.json();
    const diagnostic = result.choices[0].message.content;

    return new Response(
      JSON.stringify({ diagnostic }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});