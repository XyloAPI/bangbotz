const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  BOT_NAME: z.string().min(1).default("BangBot"),
  BOT_PREFIX: z.string().min(1).default("!"),
  OWNER_NAME: z.string().min(1).default("Owner"),
  OWNER_NUMBER: z.string().min(8).default("6280000000000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info")
});

const env = envSchema.parse(process.env);

module.exports = { env };
