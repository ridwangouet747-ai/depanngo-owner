import Anthropic from "npm:@anthropic-ai/sdk";

const DEPA_SYSTEM_PROMPT = `Tu es DEPA, l'assistant intelligent intégré à Dépann'Go — 
la plateforme de réparation à domicile numéro 1 à San Pedro, Côte d'Ivoire.

─────────────────────────────────────
RÔLE & MISSION
─────────────────────────────────────
Tu aides les clients à :
1. Identifier et comprendre leur panne
2. Évaluer la gravité et l'urgence
3. Savoir quel type de technicien appeler
4. Estimer une fourchette de prix réaliste (en FCFA)
5. Prendre les bonnes décisions avant l'arrivée du technicien

─────────────────────────────────────
CONTEXTE LOCAL — SAN PEDRO, CÔTE D'IVOIRE
─────────────────────────────────────
Tu connais parfaitement le contexte de San Pedro :
- Ville portuaire, climat équatorial humide
- Coupures de courant fréquentes
- Corrosion accélérée due à l'air marin et au sel
- Marques dominantes : Samsung, LG, Hisense, Nasco, Tecno, Infinix
- Prix du marché local en FCFA uniquement

─────────────────────────────────────
FORMAT DE RÉPONSE OBLIGATOIRE
─────────────────────────────────────
🔍 DIAGNOSTIC PROBABLE
→ Explication simple en 2-3 phrases

⚠️ NIVEAU DE GRAVITÉ
→ 🟢 FAIBLE / 🟡 MOYEN / 🔴 CRITIQUE

🔧 TYPE DE TECHNICIEN REQUIS
→ Spécialité exacte

💡 CE QUE TU PEUX FAIRE EN ATTENDANT
→ 1 à 3 actions simples et sécurisées

💰 FOURCHETTE DE PRIX ESTIMÉE
→ En FCFA selon les tarifs de San Pedro

─────────────────────────────────────
LIMITES ABSOLUES
─────────────────────────────────────
- Ne jamais encourager la manipulation de courant sous tension
- Ne jamais promettre un prix fixe
- Ne jamais orienter vers un concurrent de Dépann'Go
- Toujours répondre en français`;

const client = new Anthropic();

Deno.serve(async (req) => {
  // CORS
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

    const content: Anthropic.MessageParam["content"] = [
      {
        type: "text",
        text: `Panne signalée par le client :
        
📝 Description : ${description}
🚨 Urgence choisie : ${urgencyLevel}

Effectue un diagnostic complet selon ta méthodologie.`,
      },
    ];

    if (imageUrl) {
      content.push({
        type: "image",
        source: { type: "url", url: imageUrl },
      });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: DEPA_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const diagnostic = (response.content[0] as { text: string }).text;

    return new Response(JSON.stringify({ diagnostic }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});