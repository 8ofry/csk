// Channel-level adapters (NFR-MNT-02).
// v1 ships with a console adapter that just logs (so dev works without a gateway).
// Resend (email) and UltraMsg (WhatsApp) impls plug in via env config.
// FR-NOT-01: WhatsApp is behind this abstraction so the v2 swap to official
// Business API requires no application-code changes.

export interface ChannelMessage {
  to: { email?: string; phone?: string };
  subject: string;
  body: string;
  /** Internal correlation id for retries / audit. */
  notificationId: string;
}

export interface ChannelAdapter {
  send(msg: ChannelMessage): Promise<{ delivered: boolean; providerRef?: string; error?: string }>;
}

class ConsoleEmailAdapter implements ChannelAdapter {
  async send(msg: ChannelMessage) {
    console.info(
      `[email/console] → ${msg.to.email ?? "?"} | ${msg.subject}\n  ${msg.body.slice(0, 200)}`,
    );
    return { delivered: true, providerRef: `console-${msg.notificationId}` };
  }
}

class ConsoleWhatsAppAdapter implements ChannelAdapter {
  async send(msg: ChannelMessage) {
    console.info(
      `[whatsapp/console] → ${msg.to.phone ?? "?"} | ${msg.subject}\n  ${msg.body.slice(0, 200)}`,
    );
    return { delivered: true, providerRef: `console-${msg.notificationId}` };
  }
}

class ResendEmailAdapter implements ChannelAdapter {
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async send(msg: ChannelMessage) {
    if (!msg.to.email) return { delivered: false, error: "No email provided" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CSK Academy <noreply@csk-academy.com>",
          to: [msg.to.email],
          subject: msg.subject,
          html: msg.body.replace(/\n/g, "<br>"),
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return { delivered: false, error: `Resend error: ${res.status} ${errorText}` };
      }
      const data = await res.json() as { id: string };
      return { delivered: true, providerRef: data.id };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error occurred";
      return { delivered: false, error: errorMsg };
    }
  }
}

class UltraMsgWhatsAppAdapter implements ChannelAdapter {
  private instanceId: string;
  private token: string;
  constructor(instanceId: string, token: string) {
    this.instanceId = instanceId;
    this.token = token;
  }
  async send(msg: ChannelMessage) {
    if (!msg.to.phone) return { delivered: false, error: "No phone provided" };
    try {
      const res = await fetch(`https://api.ultramsg.com/${this.instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: this.token,
          to: msg.to.phone,
          body: `*CSK Academy* - ${msg.subject}\n\n${msg.body}`,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return { delivered: false, error: `UltraMsg error: ${res.status} ${errorText}` };
      }
      const data = await res.json() as { id: string };
      return { delivered: true, providerRef: data.id };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error occurred";
      return { delivered: false, error: errorMsg };
    }
  }
}

// In-app messages don't go to an external channel — they're just rows in the
// Notification table that the UI lists. This adapter is a no-op.
class InAppAdapter implements ChannelAdapter {
  async send() {
    return { delivered: true };
  }
}

export function emailAdapter(): ChannelAdapter {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) return new ResendEmailAdapter(apiKey);
  return new ConsoleEmailAdapter();
}

export function whatsappAdapter(): ChannelAdapter {
  const token = process.env.ULTRAMSG_TOKEN;
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  if (token && instanceId) return new UltraMsgWhatsAppAdapter(instanceId, token);
  return new ConsoleWhatsAppAdapter();
}

export function inAppAdapter(): ChannelAdapter {
  return new InAppAdapter();
}
