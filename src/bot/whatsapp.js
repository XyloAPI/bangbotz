const {
  default: makeWASocket,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

const { findCommand } = require("../commands");
const { env } = require("../config/env");
const { logger } = require("../logger");

const SESSION_DIR = ".session";
const TASK_STATUS = {
  processingReaction: "🕒",
  successReaction: "✅",
  errorReaction: "❌",
  processingPrefix: "🕒",
  successPrefix: "✅",
  errorPrefix: "❌"
};

function getTextFromMessageContent(messageContent) {
  if (!messageContent) {
    return "";
  }

  return (
    messageContent.conversation ||
    (messageContent.extendedTextMessage && messageContent.extendedTextMessage.text) ||
    (messageContent.imageMessage && messageContent.imageMessage.caption) ||
    (messageContent.videoMessage && messageContent.videoMessage.caption) ||
    ""
  );
}

function getQuotedImageMessage(message) {
  const contextInfo =
    (message.message &&
      message.message.extendedTextMessage &&
      message.message.extendedTextMessage.contextInfo) ||
    (message.message &&
      message.message.imageMessage &&
      message.message.imageMessage.contextInfo) ||
    (message.message &&
      message.message.videoMessage &&
      message.message.videoMessage.contextInfo) ||
    {};

  if (contextInfo.quotedMessage && contextInfo.quotedMessage.imageMessage) {
    return {
      key: {
        remoteJid: message.key.remoteJid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant
      },
      message: {
        imageMessage: contextInfo.quotedMessage.imageMessage
      }
    };
  }

  return null;
}

function extractCommandText(message) {
  return getTextFromMessageContent(message.message);
}

async function sendReaction(socket, jid, key, emoji) {
  await socket.sendMessage(jid, {
    react: {
      text: emoji,
      key
    }
  });
}

async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    printQRInTerminal: false,
    browser: ["BangBot", "Desktop", "1.0.0"]
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info("Scan QR di atas untuk login ke WhatsApp.");
    }

    if (connection === "open") {
      logger.info({ botName: env.BOT_NAME }, "Koneksi WhatsApp berhasil.");
    }

    if (connection === "close") {
      const shouldReconnect =
        (((lastDisconnect || {}).error || {}).output || {}).statusCode !== DisconnectReason.loggedOut;

      logger.warn({ shouldReconnect }, "Koneksi WhatsApp terputus.");

      if (shouldReconnect) {
        void startWhatsAppBot();
      }
    }
  });

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") {
      return;
    }

    for (const message of messages) {
      const remoteJid = message.key.remoteJid;
      const text = extractCommandText(message);

      if (!remoteJid || !text || message.key.fromMe) {
        continue;
      }

      if (!text.startsWith(env.BOT_PREFIX)) {
        continue;
      }

      const withoutPrefix = text.slice(env.BOT_PREFIX.length).trim();
      const [name, ...args] = withoutPrefix.split(/\s+/);
      const command = findCommand(name || "");

      if (!command) {
        await socket.sendMessage(remoteJid, {
          text: `Command tidak dikenal. Ketik ${env.BOT_PREFIX}help untuk melihat daftar command.`
        });
        continue;
      }

      try {
        await command.execute(args, {
          senderJid: remoteJid,
          prefix: env.BOT_PREFIX,
          pushName: message.pushName || undefined,
          message,
          hasImage:
            Boolean(message.message && message.message.imageMessage) ||
            Boolean(getQuotedImageMessage(message)),
          sendSticker: async () => {
            const mediaSource =
              (message.message && message.message.imageMessage && message) ||
              getQuotedImageMessage(message);

            if (!mediaSource) {
              throw new Error("NO_IMAGE");
            }

            const imageBuffer = await downloadMediaMessage(
              mediaSource,
              "buffer",
              {},
              {
                logger,
                reuploadRequest: socket.updateMediaMessage
              }
            );

            await socket.sendMessage(remoteJid, {
              sticker: imageBuffer
            });
          },
          runTask: async ({ processingText, successText, errorText }, task) => {
            let statusMessage = null;

            try {
              await sendReaction(socket, remoteJid, message.key, TASK_STATUS.processingReaction);

              statusMessage = await socket.sendMessage(
                remoteJid,
                {
                  text: `${TASK_STATUS.processingPrefix} ${processingText}`
                },
                {
                  quoted: message
                }
              );

              const result = await task();

              if (statusMessage && statusMessage.key) {
                await socket.sendMessage(remoteJid, {
                  text: `${TASK_STATUS.successPrefix} ${successText}`,
                  edit: statusMessage.key
                });
              }

              await sendReaction(socket, remoteJid, message.key, TASK_STATUS.successReaction);

              return result;
            } catch (error) {
              if (statusMessage && statusMessage.key) {
                await socket.sendMessage(remoteJid, {
                  text: `${TASK_STATUS.errorPrefix} ${errorText}`,
                  edit: statusMessage.key
                });
              } else {
                await socket.sendMessage(
                  remoteJid,
                  {
                    text: `${TASK_STATUS.errorPrefix} ${errorText}`
                  },
                  {
                    quoted: message
                  }
                );
              }

              await sendReaction(socket, remoteJid, message.key, TASK_STATUS.errorReaction);
              error.isHandled = true;
              throw error;
            }
          },
          reply: async (replyText) => {
            await socket.sendMessage(
              remoteJid,
              { text: replyText },
              { quoted: message }
            );
          }
        });
      } catch (error) {
        logger.error({ err: error, command: command.name }, "Gagal menjalankan command.");
        if (!error || !error.isHandled) {
          await socket.sendMessage(remoteJid, {
            text: "Terjadi error saat menjalankan command."
          });
        }
      }
    }
  });
}

module.exports = { startWhatsAppBot };
