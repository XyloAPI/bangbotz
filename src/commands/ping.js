const pingCommand = {
  name: "ping",
  description: "Mengecek apakah bot aktif.",
  category: "Main",
  aliases: ["p"],
  async execute(_args, context) {
    await context.reply("Pong! Bot aktif dan siap jalan.");
  }
};

module.exports = { pingCommand };
