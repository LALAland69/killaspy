import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ads, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze") {
      // Análise de padrões de copy vencedores
      systemPrompt = `Você é um especialista em copywriting para anúncios de alta conversão. Sua tarefa é analisar anúncios vencedores e identificar padrões que os fazem funcionar.

Analise os anúncios fornecidos e extraia:
1. Padrões de headline (ganchos, números, emoções)
2. Estrutura do texto principal (problema, solução, benefícios)
3. Call-to-Actions mais eficazes
4. Gatilhos mentais utilizados
5. Tom e estilo de escrita

Responda em português brasileiro, de forma estruturada e acionável.`;

      const adsText = ads.map((ad: any, i: number) => 
        `--- Anúncio ${i + 1} (${ad.longevity_days || 0} dias rodando) ---
Headline: ${ad.headline || "Sem headline"}
Texto: ${ad.primary_text || "Sem texto"}
CTA: ${ad.cta || "Sem CTA"}
`).join("\n");

      userPrompt = `Analise estes ${ads.length} anúncios vencedores e identifique os padrões de sucesso:\n\n${adsText}`;
    } else if (action === "generate") {
      // Geração de copy baseado em padrões
      systemPrompt = `Você é um copywriter especialista em criar anúncios de alta conversão para Facebook/Instagram. 

Sua tarefa é criar variações de copy baseadas em anúncios vencedores fornecidos como referência.

Regras:
- Mantenha o mesmo tom e estilo dos anúncios de referência
- Use os mesmos gatilhos mentais identificados
- Crie headlines impactantes com 5-10 palavras
- Texto principal deve ter no máximo 150 palavras
- Inclua CTA claro e direto
- Escreva em português brasileiro

Formato de resposta:
Para cada variação, forneça:
- Headline
- Texto Principal
- CTA sugerido`;

      const referenceAds = ads.slice(0, 3).map((ad: any) => 
        `Headline: ${ad.headline || ""}
Texto: ${ad.primary_text || ""}
CTA: ${ad.cta || ""}`
      ).join("\n---\n");

      userPrompt = `Baseado nestes anúncios vencedores de referência:\n\n${referenceAds}\n\nCrie 3 variações de copy que sigam os mesmos padrões de sucesso.`;
    } else {
      throw new Error("Invalid action. Use 'analyze' or 'generate'");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ 
      success: true, 
      result: content,
      action,
      adsAnalyzed: ads.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-copy error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
