/**
 * GET /api/debug, prüft ob Umgebungsvariablen ankommen
 * Nur für interne Diagnose, gibt keine sensitiven Werte zurück.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    dbHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).host
      : "nicht gesetzt",
    nodeEnv: process.env.NODE_ENV,
  });
}
