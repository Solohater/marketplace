import { sql } from "../src/db/client.js";
import {
  clearRecording,
  recordingStore,
} from "../src/providers/messages/recording-message-provider.js";

export async function truncateAll(): Promise<void> {
  await sql`TRUNCATE media, verification_tokens, sessions, users RESTART IDENTITY CASCADE`;
}

export function resetMessages(): void {
  clearRecording();
}

export function lastEmail() {
  return recordingStore.emails.at(-1);
}

export function lastSms() {
  return recordingStore.sms.at(-1);
}

export function extractTokenFromEmailText(text: string): string {
  const match = text.match(/[?&]token=([^&\s]+)/);
  if (!match?.[1]) throw new Error("No token found in email text");
  return match[1];
}

export function extractCodeFromSms(message: string): string {
  const match = message.match(/\d{6}/);
  if (!match?.[0]) throw new Error("No 6-digit code found in SMS");
  return match[0];
}

export function cookieValue(setCookies: string[], name: string): string {
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0];
    if (!pair) continue;
    const equals = pair.indexOf("=");
    if (equals > 0 && pair.slice(0, equals) === name) {
      return pair.slice(equals + 1);
    }
  }
  throw new Error(`Cookie ${name} not found`);
}
