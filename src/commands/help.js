const { env } = require("../config/env");

function toMonospaceFancy(text) {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const fancy = "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣0123456789";

  return text
    .split("")
    .map((char) => {
      const index = normal.indexOf(char);
      return index >= 0 ? fancy[index] : char;
    })
    .join("");
}

function formatCategoryName(name) {
  return toMonospaceFancy(name.toUpperCase());
}

function groupCommandsByCategory(commands) {
  const grouped = new Map();

  for (const command of commands) {
    const category = command.category || "Other";

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }

    grouped.get(category).push(command);
  }

  return grouped;
}

function createMenuMessage(commands, context, mode) {
  const now = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date());

  const displayName = context.pushName || "Kak";
  const fancyBotName = toMonospaceFancy(env.BOT_NAME.toUpperCase());
  const groupedCommands = groupCommandsByCategory(commands);
  const categoryNames = Array.from(groupedCommands.keys());

  const message = [
    `╭━〔 ${fancyBotName} 𝙼𝙴𝙽𝚄 〕━⬣`,
    "",
    `┃ Hai ${displayName}`,
    `┃ Bot siap bantu kamu sekarang juga`,
    `╰━━━━━━━━━━━━━━━━━━⬣`,
    "",
    `╭─〔 𝙱𝙾𝚃 𝙸𝙽𝙵𝙾 〕`,
    `│ 𝙽𝚊𝚖𝚊   : ${env.BOT_NAME}`,
    `│ 𝙿𝚛𝚎𝚏𝚒𝚡 : ${env.BOT_PREFIX}`,
    `│ 𝙾𝚠𝚗𝚎𝚛  : ${env.OWNER_NAME}`,
    `│ 𝚆𝚊𝚔𝚝𝚞  : ${now}`,
    `│ 𝙺𝚊𝚝𝚎𝚐𝚘𝚛𝚒: ${categoryNames.length}`,
    `│ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 : ${commands.length}`,
    `╰────────────⬣`,
    ""
  ];

  if (mode === "categories") {
    message.push(
      `╭─〔 𝙺𝙰𝚃𝙴𝙶𝙾𝚁𝙸 〕`,
      ...categoryNames.map((category) => `│ • ${formatCategoryName(category)}`),
      "╰────────────⬣",
      "",
      `Ketik ${env.BOT_PREFIX}allmenu untuk melihat semua command.`
    );

    return message;
  }

  message.push(`╭─〔 𝙰𝙻𝙻 𝙼𝙴𝙽𝚄 〕`);

  for (const [category, categoryCommands] of groupedCommands.entries()) {
    message.push(`│`);
    message.push(`├─ ${formatCategoryName(category)}`);

    for (const command of categoryCommands) {
      const aliasText = command.aliases && command.aliases.length > 0
        ? ` (${command.aliases.map((alias) => `${env.BOT_PREFIX}${alias}`).join(", ")})`
        : "";

      message.push(`│ • ${env.BOT_PREFIX}${command.name}${aliasText}`);
      message.push(`│   ${command.description}`);
    }
  }

  message.push("╰────────────⬣");
  return message;
}

function createHelpCommands(commands) {
  const menuExecutor = async (_args, context, mode) => {
    const message = createMenuMessage(commands, context, mode);
    await context.reply(message.join("\n"));
  };

  return [
    {
      name: "help",
      description: "Menampilkan daftar kategori menu.",
      category: "Info",
      aliases: ["menu"],
      async execute(args, context) {
        await menuExecutor(args, context, "categories");
      }
    },
    {
      name: "allmenu",
      description: "Menampilkan semua command berdasarkan kategori.",
      category: "Info",
      aliases: [],
      async execute(args, context) {
        await menuExecutor(args, context, "all");
      }
    }
  ];
}

module.exports = { createHelpCommands };
