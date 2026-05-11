import { jsonResponse } from "@/lib/api";

// GET /api/v1/public — discovery index for v2 mobile and integrators.
export function GET() {
  return jsonResponse({
    version: "v1",
    docs: "/README.md",
    public: {
      "GET /api/v1/public/locations": "List active CSK venues",
      "GET /api/v1/public/disciplines": "List active disciplines with active group counts",
      "GET /api/v1/public/coaches": "List active coaches with their disciplines + locations",
      "GET /api/v1/public/schedule": "Weekly schedule grouped per location",
      "GET /api/v1/public/champions?limit=24": "CSK fighters with W-L-D record + method breakdown",
      "GET /api/v1/public/fighter/:id":
        "Sanitized per-fighter profile (record + fights + championships + belt levels)",
      "GET /api/v1/public/pricing": "Pricing snapshot",
      "GET /api/v1/public/merchandise": "Active in-stock merchandise items",
      "POST /api/v1/public/contact": "Submit a public inquiry",
      "POST /api/v1/public/register-trainee": "Self-register a trainee account (creates PENDING)",
    },
    auth: {
      "POST /api/v1/auth/login":
        "Body { identifier, password, deviceLabel? } → { token, expiresAt, user }",
      "POST /api/v1/auth/logout": "Authorization: Bearer <token> → revokes that token",
      "GET /api/v1/me": "Current authenticated user profile",
    },
    trainee: {
      "GET /api/v1/me/subscriptions": "Active subscriptions for the trainee",
      "GET /api/v1/me/payments?limit=50": "Payment history",
      "GET /api/v1/me/schedule?weeks=2": "Upcoming derived sessions across enrolled groups",
      "GET /api/v1/me/evaluations": "Recent quick + body-map evaluations",
      "GET /api/v1/me/reports/monthly": "Monthly performance reports (PDFs via /files/...)",
      "GET /api/v1/me/certificates": "Awards timeline",
      "GET /api/v1/me/championships": "Open events + own registrations + career record",
      "GET /api/v1/me/medical": "Medical record + documents + clearance status",
    },
    coach: {
      "GET /api/v1/coach/today?date=YYYY-MM-DD": "Scheduled occurrences for the coach today",
      "GET /api/v1/coach/sessions/:id": "Session detail",
      "POST /api/v1/coach/sessions/:id/start":
        "Body { groupId, scheduledStart } → materializes a Session row",
      "POST /api/v1/coach/sessions/:id/attendance":
        "Body { marks: [{ traineeId, status, arrivalTime? }] }",
      "POST /api/v1/coach/sessions/:id/quick-eval":
        "Body { traineeId, effortScore, notes?, flaggedBodyPart?, flaggedSkill? }",
      "GET /api/v1/coach/earnings?from&to": "Coach earnings broken down by stream",
    },
    headCoach: {
      "GET /api/v1/head-coach/approvals":
        "Combined queue: session plans + daily reports + pending users",
      "POST /api/v1/head-coach/session-plans/:id/decision":
        'Body { decision: "approve" } | { decision: "reject", comment }',
      "POST /api/v1/head-coach/daily-reports/:id/decision":
        'Body { decision: "approve" } | { decision: "reject", comment }',
    },
    files: {
      "GET /api/v1/files/:scope/:key":
        "Stream a stored file (monthly-report / certificate / medical-document require auth)",
    },
    health: {
      "GET /api/healthz": "Liveness + DB readiness probe",
    },
  });
}
