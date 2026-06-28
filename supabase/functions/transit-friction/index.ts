import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    const radius = Number(url.searchParams.get("radius") ?? "200");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return jsonResponse({ error: "lat and lng query params are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({
        friction_index: 1.9,
        active_hazards_count: 3,
        risk_factors: ["Pothole", "Water Leakage", "Broken Streetlight"],
        source: "mock",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase.rpc("get_route_friction_index", {
      target_lat: lat,
      target_lng: lng,
      radius_meters: radius,
    });

    if (error) throw error;

    return jsonResponse({
      ...(data?.[0] ?? {
        friction_index: 1.0,
        active_hazards_count: 0,
        risk_factors: [],
      }),
      source: "live",
    });
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
