const { startWhatsAppBot } = require("./bot/whatsapp");
const { env } = require("./config/env");
const { logger } = require("./logger");

async function main() {
  logger.info(
    {
      botName: env.BOT_NAME,
      prefix: env.BOT_PREFIX,
      owner: env.OWNER_NUMBER
    },
    "Menjalankan bot."
  );

  await startWhatsAppBot();
}

main().catch((error) => {
  logger.fatal({ err: error }, "Bot gagal start.");
  process.exit(1);
});
