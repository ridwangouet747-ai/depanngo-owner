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

const ALLOWED_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const MAX_DESCRIPTION_LENGTH = 2000;

// @ts-expect-error - Deno runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { description, urgencyLevel, imageUrl } = await req.json();

    if (!description || typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing description (max 2000 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const allowedUrgency = ["low", "medium", "high"];
    const safeUrgency = allowedUrgency.includes(urgencyLevel) ? urgencyLevel : "medium";

    // @ts-expect-error - Deno runtime
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set in Supabase Edge Function secrets");
      return new Response(
        JSON.stringify({ error: "Service IA non configuré. Veuillez contacter l'administrateur." }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeDescription = description.replace(/[<>"'&]/g, "").slice(0, MAX_DESCRIPTION_LENGTH);

    let userMessage = `Panne signalée par le client :
📝 Description : ${safeDescription}
🚨 Urgence choisie : ${safeUrgency === "low" ? "Faible" : safeUrgency === "medium" ? "Moyen" : "Critique"}`;

    if (imageUrl && typeof imageUrl === "string") {
      userMessage += `
📷 Photo fournie par le client : ${imageUrl}
(Note: analyse la description du client, la photo est fournie comme référence visuelle)`;
    }

    userMessage += `\n\nEffectue un diagnostic complet selon ta méthodologie.`;

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
          { role: "user", content: userMessage }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq API error:", response.status, errorBody);
      return new Response(
        JSON.stringify({ error: "Service IA temporairement indisponible. Réessayez dans quelques instants." }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error("Unexpected Groq response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "Réponse inattendue du service IA" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const diagnostic = result.choices[0].message.content;

    return new Response(
      JSON.stringify({ diagnostic }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Diagnostic IA error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du service IA" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
