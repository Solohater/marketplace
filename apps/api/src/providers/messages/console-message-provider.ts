import { logger } from "../../logger.js";
import type {
  MessageProvider,
  SendEmailInput,
  SendSmsInput,
} from "./types.js";

/**
 * Development-only message provider.
 *
 * INTEGRATION: swap this for a real email/SMS gateway (e.g. Resend/SMTP and an
 * SMS provider). The provider interface in ./types.ts is the seam — nothing
 * outside this folder changes when a real gateway is wired up.
 */
export class ConsoleMessageProvider implements MessageProvider {
  readonly name = "console";

  async sendEmail(input: SendEmailInput): Promise<void> {
    logger.info(
      {
        provider: "console",
        to: input.to,
        subject: input.subject,
        text: input.text,
      },
      "Email sent (console provider)"
    );
  }

  async sendSms(input: SendSmsInput): Promise<void> {
    logger.info(
      {
        provider: "console",
        to: input.to,
        message: input.message,
      },
      "SMS sent (console provider)"
    );
  }
}
