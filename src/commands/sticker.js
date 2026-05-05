const stickerCommand = {
  name: "sticker",
  description: "Mengubah gambar menjadi sticker WhatsApp.",
  category: "Converter",
  aliases: ["s", "stiker"],
  async execute(_args, context) {
    if (!context.hasImage) {
      await context.reply(
        [
          "Kirim gambar dengan caption perintah, atau reply gambar dengan command ini.",
          `Contoh: ${context.prefix}sticker`
        ].join("\n")
      );
      return;
    }

    try {
      await context.runTask(
        {
          processingText: "Sebentar, gambarnya lagi saya ubah jadi sticker...",
          successText: "Sticker berhasil dibuat.",
          errorText: "Sticker gagal dibuat."
        },
        async () => {
          await context.sendSticker();
        }
      );
    } catch (error) {
      if (error && error.message === "NO_IMAGE") {
        await context.reply("Saya tidak menemukan gambar untuk dijadikan sticker.");
        return;
      }

      throw error;
    }
  }
};

module.exports = { stickerCommand };
