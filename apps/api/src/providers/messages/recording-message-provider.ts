import type {
  MessageProvider,
  SendEmailInput,
  SendSmsInput,
} from "./types.js";

export const recordingStore: { emails: SendEmailInput[]; sms: SendSmsInput[] } =
  { emails: [], sms: [] };

export function clearRecording(): void {
  recordingStore.emails = [];
  recordingStore.sms = [];
}

/**
 * Test-only message provider (MESSAGE_PROVIDER=recording). Records outgoing
 * messages in memory so integration tests can complete verification flows.
 * Not used in development or production.
 */
export class RecordingMessageProvider implements MessageProvider {
  readonly name = "recording";

  async sendEmail(input: SendEmailInput): Promise<void> {
    recordingStore.emails.push(input);
  }

  async sendSms(input: SendSmsInput): Promise<void> {
    recordingStore.sms.push(input);
  }
}
