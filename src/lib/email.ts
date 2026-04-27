import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_FROM = process.env.CONTACT_FROM ?? "Contact Form <hello@magnusmagi.com>";
const CONTACT_TO = process.env.CONTACT_TO ?? "hello@magnusmagi.com";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!cachedClient) {
    cachedClient = new Resend(RESEND_API_KEY);
  }
  return cachedClient;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  locale: string;
}

export async function sendContactEmail(input: ContactMessage): Promise<void> {
  const client = getClient();

  const subject = `New message from ${input.name} (${input.locale})`;

  const text = [
    `From: ${input.name} <${input.email}>`,
    `Locale: ${input.locale}`,
    "",
    input.message,
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #111;">New contact form message</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
        <tr>
          <td style="padding: 8px 0; color: #777; width: 80px;">From</td>
          <td style="padding: 8px 0;">${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #777;">Locale</td>
          <td style="padding: 8px 0;">${escapeHtml(input.locale)}</td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #111;">${escapeHtml(input.message)}</div>
    </div>
  `.trim();

  const { error } = await client.emails.send({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    replyTo: input.email,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message ?? "unknown"}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
