import { env } from "../../config/env.js";
import { ConsoleMessageProvider } from "./console-message-provider.js";
import { RecordingMessageProvider } from "./recording-message-provider.js";
import type { MessageProvider } from "./types.js";

export function createMessageProvider(): MessageProvider {
  switch (env.MESSAGE_PROVIDER) {
    case "recording":
      return new RecordingMessageProvider();
    case "console":
    default:
      return new ConsoleMessageProvider();
  }
}
