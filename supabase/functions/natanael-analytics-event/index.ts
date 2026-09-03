import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const ALLOWED_EVENTS = new Set(["page_view", "generate_lead", "begin_checkout"]);
const ALLOWED_CHANNELS = new Set(["ai_assistant", "organic_search", "paid_search", "social", "referral", "campaign", "direct"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16_384;

function getSecretKey(): string {
  const serializedKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (serializedKeys) {
    try {
      const keys = JSON.parse(serializedKeys) as Record<string, unknown>;
      if (typeof keys.default === "string" && keys.default) return keys.default;
    } catch {
      // Fall back to the legacy service-role key below.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function sanitizeText(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/\b\d{10,14}\b/g, "[redacted]")
    .slice(0, maxLength);
}

function sanitizeUuid(value: unknown): string | null {
  const candidate = sanitizeText(value, 50);
  return candidate && UUID_PATTERN.test(candidate) ? candidate.toLowerCase() : null;
}

function sanitizePath(value: unknown): string {
  const candidate = sanitizeText(value, 1000) ?? "/";
  try {
    const url = new URL(candidate, "https://natanaelalbinofestas.com");
    return (url.pathname || "/").slice(0, 500);
  } catch {
    return candidate.split(/[?#]/, 1)[0].slice(0, 500) || "/";
  }
}

function sanitizeTimestamp(value: unknown): string {
  const now = Date.now();
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(timestamp)) return new Date(now).toISOString();
  if (timestamp < now - 7 * 86_400_000 || timestamp > now + 300_000) return new Date(now).toISOString();
  return new Date(timestamp).toISOString();
}

function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !isLocal) return null;
    if (hostname === "natanaelalbinofestas.com" || hostname === "www.natanaelalbinofestas.com") return origin;
    if (hostname === "zoqvera.github.io" || isLocal) return origin;
  } catch {
    return null;
  }
  return null;
}

function responseHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = { "Cache-Control": "no-store", "Vary": "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "content-type";
  }
  return headers;
}

function noContent(origin: string | null): Response {
  return new Response(null, { status: 204, headers: responseHeaders(origin) });
}

Deno.serve(async (request: Request) => {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigin = resolveAllowedOrigin(requestOrigin);

  if (request.method === "OPTIONS") return noContent(allowedOrigin);
  if (request.method !== "POST") return new Response(null, { status: 405, headers: responseHeaders(allowedOrigin) });
  if (!requestOrigin || !allowedOrigin) return noContent(null);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return noContent(allowedOrigin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) return noContent(allowedOrigin);

  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) return noContent(allowedOrigin);
    const input = rawBody as Record<string, unknown>;

    const eventId = sanitizeUuid(input.event_id);
    const visitorId = sanitizeUuid(input.visitor_id);
    const sessionId = sanitizeUuid(input.session_id);
    const eventName = sanitizeText(input.event_name, 40);
    if (!eventId || !visitorId || !sessionId || !eventName || !ALLOWED_EVENTS.has(eventName)) return noContent(allowedOrigin);

    const { data: allowed } = await admin.rpc("consume_natanael_analytics_rate_limit", {
      target_bucket_key: `natanael:${visitorId}`,
      target_window_seconds: 3600,
      target_max_requests: 120,
    });
    if (!allowed) return noContent(allowedOrigin);

    const channelCandidate = (sanitizeText(input.traffic_channel, 50) ?? "direct").toLowerCase();
    const trafficChannel = ALLOWED_CHANNELS.has(channelCandidate) ? channelCandidate : "referral";
    const aiAssistant = sanitizeText(input.ai_assistant, 50)?.toLowerCase() ?? null;
    const isCtaEvent = eventName !== "page_view";

    const { error } = await admin.from("natanael_acquisition_events").insert({
      event_id: eventId,
      event_name: eventName,
      visitor_id: visitorId,
      session_id: sessionId,
      source: (sanitizeText(input.source, 80) ?? "direct").toLowerCase(),
      medium: (sanitizeText(input.medium, 80) ?? "none").toLowerCase(),
      campaign: sanitizeText(input.campaign, 100) ?? "not_set",
      traffic_channel: trafficChannel,
      ai_assistant: aiAssistant && aiAssistant !== "not_set" ? aiAssistant : null,
      page_path: sanitizePath(input.page_path),
      landing_page: sanitizePath(input.landing_page),
      cta_location: isCtaEvent ? (sanitizeText(input.cta_location, 80)?.toLowerCase() ?? "unknown") : null,
      cta_label: isCtaEvent ? (sanitizeText(input.cta_label, 120) ?? "CTA sem rótulo") : null,
      cta_method: isCtaEvent ? (sanitizeText(input.cta_method, 50)?.toLowerCase() ?? "website") : null,
      occurred_at: sanitizeTimestamp(input.occurred_at),
    });

    if (error && error.code !== "23505") console.error("Natanael analytics insert failed", error.code ?? "unknown");
  } catch (error) {
    console.error("Natanael analytics ingestion failed", error instanceof Error ? error.message : "unknown");
  }

  return noContent(allowedOrigin);
});
