import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_PROMPT = `Analyze this civic infrastructure image.
Return JSON only with these fields:
- issue_type: one of Pothole, Water Leakage, Broken Streetlight, Waste Accumulation, Drainage, Graffiti, Illegal Dumping
- severity: Low, Medium, or High
- description: clean 2-sentence technical description
- confidence_score: integer 0-100`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { image, lat, lng } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return jsonResponse({
        analysis: {
          issue_type: "Pothole",
          severity: "High",
          description: "Mock analysis — set GEMINI_API_KEY in Supabase secrets.",
          confidence_score: 85,
        },
        trust_score: 80,
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_PROMPT },
                { inline_data: { mime_type: "image/jpeg", data: image } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                issue_type: { type: "STRING" },
                severity: { type: "STRING" },
                description: { type: "STRING" },
                confidence_score: { type: "INTEGER" },
              },
              required: ["issue_type", "severity", "description", "confidence_score"],
            },
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const analysis = JSON.parse(text);
    const gpsPresent = lat != null && lng != null;
    const trust_score = Math.min(
      100,
      Math.round(analysis.confidence_score * 0.7 + (gpsPresent ? 20 : 0))
    );

    return jsonResponse({ analysis, trust_score });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
