export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendSmsInput {
  to: string;
  message: string;
}

export interface MessageProvider {
  readonly name: string;
  sendEmail(input: SendEmailInput): Promise<void>;
  sendSms(input: SendSmsInput): Promise<void>;
}
