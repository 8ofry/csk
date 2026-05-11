// Notification event catalog (SRS §6.13 channel matrix).
// Each event declares: default channels, criticality, and locale-keyed templates.
// Critical events cannot be opted out (FR-NOT-04).

export type NotificationChannel = "WHATSAPP" | "EMAIL" | "IN_APP";

export type EventType =
  | "WELCOME_ON_ACTIVATION"
  | "DAILY_REPORT_READY"
  | "MONTHLY_REPORT_READY"
  | "PAYMENT_REMINDER"
  | "PAYMENT_OVERDUE"
  | "SESSION_CANCELLED"
  | "SESSION_PLAN_DECISION"
  | "BELT_EXAM_SCHEDULED"
  | "CHAMPIONSHIP_OPEN"
  | "MEDICAL_DOC_EXPIRING"
  | "ACCOUNT_APPROVAL"
  | "DAILY_REPORT_NEEDS_REVISION"
  | "BEST_TRAINEE_AWARD";

export interface EventSpec {
  defaultChannels: NotificationChannel[];
  /** Critical events bypass user opt-out (FR-NOT-04). */
  critical: boolean;
}

// Per SRS §6.13 channel matrix. ✓ entries become defaultChannels.
export const EVENT_CATALOG: Record<EventType, EventSpec> = {
  WELCOME_ON_ACTIVATION: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  DAILY_REPORT_READY: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  MONTHLY_REPORT_READY: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  PAYMENT_REMINDER: { defaultChannels: ["EMAIL", "IN_APP"], critical: false },
  PAYMENT_OVERDUE: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: true },
  SESSION_CANCELLED: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  SESSION_PLAN_DECISION: { defaultChannels: ["EMAIL", "IN_APP"], critical: false },
  BELT_EXAM_SCHEDULED: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  CHAMPIONSHIP_OPEN: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
  MEDICAL_DOC_EXPIRING: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: true },
  ACCOUNT_APPROVAL: { defaultChannels: ["EMAIL", "IN_APP"], critical: false },
  DAILY_REPORT_NEEDS_REVISION: { defaultChannels: ["EMAIL", "IN_APP"], critical: false },
  BEST_TRAINEE_AWARD: { defaultChannels: ["WHATSAPP", "EMAIL", "IN_APP"], critical: false },
};

export interface RenderedMessage {
  subject: string;
  body: string;
}

export interface EventPayload {
  // Loose key-value bag; templates pick what they need.
  [k: string]: unknown;
}

type Locale = "ar" | "en";

type Template = (p: EventPayload) => RenderedMessage;

const TEMPLATES: Record<EventType, Record<Locale, Template>> = {
  WELCOME_ON_ACTIVATION: {
    en: (p) => ({
      subject: `Welcome to CSK Academy, ${p.name ?? ""}!`,
      body: `Your account is active. You can sign in at ${p.appUrl ?? ""}.`,
    }),
    ar: (p) => ({
      subject: `أهلاً بك في أكاديمية CSK، ${p.name ?? ""}!`,
      body: `حسابك مفعّل. يمكنك تسجيل الدخول من ${p.appUrl ?? ""}.`,
    }),
  },
  DAILY_REPORT_READY: {
    en: (p) => ({
      subject: `Daily report — ${p.groupName ?? ""}`,
      body: `Today's session report for ${p.traineeName ?? ""} is ready: ${p.url ?? ""}`,
    }),
    ar: (p) => ({
      subject: `تقرير اليوم — ${p.groupName ?? ""}`,
      body: `تقرير حصة اليوم لـ ${p.traineeName ?? ""} جاهز: ${p.url ?? ""}`,
    }),
  },
  MONTHLY_REPORT_READY: {
    en: (p) => ({
      subject: `Monthly performance report — ${p.periodLabel ?? ""}`,
      body: `Your CSK monthly report is ready as a PDF: ${p.pdfUrl ?? ""}`,
    }),
    ar: (p) => ({
      subject: `التقرير الشهري — ${p.periodLabel ?? ""}`,
      body: `تقريرك الشهري من CSK جاهز بصيغة PDF: ${p.pdfUrl ?? ""}`,
    }),
  },
  PAYMENT_REMINDER: {
    en: (p) => ({
      subject: `Subscription reminder`,
      body: `Your CSK subscription of ${p.amount ?? ""} EGP is due on ${p.dueDate ?? ""}.`,
    }),
    ar: (p) => ({
      subject: `تذكير بدفع الاشتراك`,
      body: `اشتراكك في CSK بمبلغ ${p.amount ?? ""} ج.م مستحق في ${p.dueDate ?? ""}.`,
    }),
  },
  PAYMENT_OVERDUE: {
    en: (p) => ({
      subject: `Subscription overdue`,
      body: `Your CSK subscription of ${p.amount ?? ""} EGP is past due. Please settle to keep training.`,
    }),
    ar: (p) => ({
      subject: `اشتراك متأخر السداد`,
      body: `اشتراك CSK بمبلغ ${p.amount ?? ""} ج.م متأخر. يرجى السداد لاستكمال التدريب.`,
    }),
  },
  SESSION_CANCELLED: {
    en: (p) => ({
      subject: `Session cancelled`,
      body: `${p.groupName ?? ""} session on ${p.when ?? ""} is cancelled. Reason: ${p.reason ?? "—"}.`,
    }),
    ar: (p) => ({
      subject: `إلغاء الحصة`,
      body: `حصة ${p.groupName ?? ""} في ${p.when ?? ""} ملغاة. السبب: ${p.reason ?? "—"}.`,
    }),
  },
  SESSION_PLAN_DECISION: {
    en: (p) => ({
      subject: `Session plan ${p.decision ?? ""}`,
      body: `Your plan for ${p.groupName ?? ""} on ${p.when ?? ""} was ${p.decision ?? ""}. ${p.comment ?? ""}`,
    }),
    ar: (p) => ({
      subject: `قرار خطة الحصة ${p.decision ?? ""}`,
      body: `خطتك لمجموعة ${p.groupName ?? ""} في ${p.when ?? ""}: ${p.decision ?? ""}. ${p.comment ?? ""}`,
    }),
  },
  BELT_EXAM_SCHEDULED: {
    en: (p) => ({
      subject: `Belt exam scheduled`,
      body: `Belt exam on ${p.date ?? ""} at ${p.location ?? ""}. Fee: ${p.fee ?? ""} EGP.`,
    }),
    ar: (p) => ({
      subject: `موعد امتحان الحزام`,
      body: `امتحان الحزام بتاريخ ${p.date ?? ""} في ${p.location ?? ""}. الرسم: ${p.fee ?? ""} ج.م.`,
    }),
  },
  CHAMPIONSHIP_OPEN: {
    en: (p) => ({
      subject: `Championship open: ${p.name ?? ""}`,
      body: `Registration for ${p.name ?? ""} is open until ${p.deadline ?? ""}.`,
    }),
    ar: (p) => ({
      subject: `فتح التسجيل: ${p.name ?? ""}`,
      body: `التسجيل في بطولة ${p.name ?? ""} مفتوح حتى ${p.deadline ?? ""}.`,
    }),
  },
  MEDICAL_DOC_EXPIRING: {
    en: (p) => ({
      subject: `Medical document expiring`,
      body: `Your ${p.docType ?? "medical document"} expires on ${p.expiryDate ?? ""}. Renew to remain eligible to train and compete.`,
    }),
    ar: (p) => ({
      subject: `انتهاء صلاحية وثيقة طبية`,
      body: `وثيقتك (${p.docType ?? "طبية"}) تنتهي في ${p.expiryDate ?? ""}. يلزم التجديد للاستمرار في التدريب والمنافسة.`,
    }),
  },
  ACCOUNT_APPROVAL: {
    en: (p) => ({
      subject: `Account ${p.decision ?? ""}`,
      body: `Your CSK account was ${p.decision ?? ""}.`,
    }),
    ar: (p) => ({
      subject: `حالة الحساب: ${p.decision ?? ""}`,
      body: `حسابك في CSK تم ${p.decision ?? ""}.`,
    }),
  },
  DAILY_REPORT_NEEDS_REVISION: {
    en: (p) => ({
      subject: `Daily report needs revision`,
      body: `${p.groupName ?? ""} daily report needs revision: ${p.comment ?? ""}`,
    }),
    ar: (p) => ({
      subject: `التقرير اليومي يحتاج تعديل`,
      body: `تقرير ${p.groupName ?? ""} يحتاج تعديل: ${p.comment ?? ""}`,
    }),
  },
  BEST_TRAINEE_AWARD: {
    en: (p) => ({
      subject: `Award: ${p.awardName ?? ""}`,
      body: `Congratulations — you received: ${p.awardName ?? ""}.`,
    }),
    ar: (p) => ({
      subject: `جائزة: ${p.awardName ?? ""}`,
      body: `تهانينا — حصلت على: ${p.awardName ?? ""}.`,
    }),
  },
};

export function renderTemplate(
  eventType: EventType,
  locale: Locale,
  payload: EventPayload,
): RenderedMessage {
  return TEMPLATES[eventType][locale](payload);
}
