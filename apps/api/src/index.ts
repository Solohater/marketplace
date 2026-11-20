import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const app = await createApp();
  app.listen(env.PORT, () => {
    logger.info(`Marketplace API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, "API failed to start");
  process.exit(1);
});
